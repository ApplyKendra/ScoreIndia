package services

import (
	"context"
	"errors"
	"time"

	"github.com/auctionapp/backend/internal/config"
	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/auctionapp/backend/internal/utils"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// AuthService handles authentication operations
type AuthService struct {
	repos       *repository.Repositories
	cfg         *config.Config
	redis       *redis.Client
}

// NewAuthService creates a new auth service
func NewAuthService(repos *repository.Repositories, cfg *config.Config, redis *redis.Client) *AuthService {
	return &AuthService{
		repos: repos,
		cfg:   cfg,
		redis: redis,
	}
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.LoginResponse, error) {
	// Find user by email
	user, err := s.repos.Users.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Check if user is active
	if user.Status != "active" {
		return nil, errors.New("account is not active")
	}

	// Verify password
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	// Get expirations based on role
	accessDuration, refreshDuration := utils.GetTokenExpirations(user.Role)

	// Generate tokens
	accessToken, err := utils.GenerateJWT(
		user.ID, user.Email, user.Role, user.TeamID,
		s.cfg.JWTSecret, accessDuration,
	)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, s.cfg.JWTSecret, refreshDuration)
	if err != nil {
		return nil, err
	}

	// Clear password hash before returning
	user.PasswordHash = ""

	return &models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    accessDuration * 60, // in seconds
		User:         user,
	}, nil
}

// RefreshToken generates new tokens from a refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*models.LoginResponse, error) {
	// Check if refresh token is blacklisted
	blacklisted, err := s.IsRefreshTokenBlacklisted(ctx, refreshToken)
	if err == nil && blacklisted {
		return nil, errors.New("refresh token has been revoked")
	}

	// Validate refresh token
	userID, err := utils.ValidateRefreshToken(refreshToken, s.cfg.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Get user
	user, err := s.repos.Users.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Status != "active" {
		return nil, errors.New("account is not active")
	}

	// Get expirations based on role
	accessDuration, refreshDuration := utils.GetTokenExpirations(user.Role)

	// Generate new tokens
	accessToken, err := utils.GenerateJWT(
		user.ID, user.Email, user.Role, user.TeamID,
		s.cfg.JWTSecret, accessDuration,
	)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, s.cfg.JWTSecret, refreshDuration)
	if err != nil {
		return nil, err
	}

	// Blacklist the old refresh token (token rotation)
	// Get expiry from token claims
	if claims, parseErr := jwt.ParseWithClaims(refreshToken, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	}); parseErr == nil {
		if oldClaims, ok := claims.Claims.(*jwt.RegisteredClaims); ok && oldClaims.ExpiresAt != nil {
			expiryTime := oldClaims.ExpiresAt.Time
			remainingMinutes := int(time.Until(expiryTime).Minutes())
			if remainingMinutes > 0 {
				s.BlacklistRefreshToken(ctx, refreshToken, remainingMinutes)
			}
		}
	}

	user.PasswordHash = ""

	return &models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    accessDuration * 60,
		User:         user,
	}, nil
}

// GetCurrentUser returns the currently authenticated user
func (s *AuthService) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	user, err := s.repos.Users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = ""

	// Load team info if assigned
	if user.TeamID != nil {
		team, err := s.repos.Teams.FindByID(ctx, *user.TeamID)
		if err == nil {
			user.Team = team
		}
	}

	return user, nil
}

// ChangePassword changes a user's password after verifying the current password
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	// Get user with password
	user, err := s.repos.Users.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify current password
	if !utils.CheckPassword(currentPassword, user.PasswordHash) {
		return errors.New("current password is incorrect")
	}

	// Validate new password
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	// Hash new password
	newHash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	// Update password
	return s.repos.Users.UpdatePassword(ctx, userID, newHash)
}

// BlacklistToken adds a token to the blacklist in Redis
// The token will be blacklisted until its natural expiration time
func (s *AuthService) BlacklistToken(ctx context.Context, tokenString string, expiryMinutes int) error {
	if s.redis == nil {
		// If Redis is not available, silently fail (fail-open for availability)
		return nil
	}

	// Create a hash of the token for the key (for security, don't store full token)
	key := "blacklist:token:" + tokenString
	
	// Set the token as blacklisted with expiration matching token expiry
	// Add 5 minutes buffer to ensure it's blacklisted even if clock skew occurs
	expiry := time.Duration(expiryMinutes+5) * time.Minute
	
	return s.redis.Set(ctx, key, "1", expiry).Err()
}

// IsTokenBlacklisted checks if a token is blacklisted
func (s *AuthService) IsTokenBlacklisted(ctx context.Context, tokenString string) (bool, error) {
	if s.redis == nil {
		// If Redis is not available, assume token is not blacklisted (fail-open)
		return false, nil
	}

	key := "blacklist:token:" + tokenString
	exists, err := s.redis.Exists(ctx, key).Result()
	if err != nil {
		// On error, assume not blacklisted (fail-open)
		return false, nil
	}

	return exists > 0, nil
}

// BlacklistRefreshToken adds a refresh token to the blacklist
func (s *AuthService) BlacklistRefreshToken(ctx context.Context, tokenString string, expiryMinutes int) error {
	if s.redis == nil {
		return nil
	}

	key := "blacklist:refresh:" + tokenString
	expiry := time.Duration(expiryMinutes+5) * time.Minute
	
	return s.redis.Set(ctx, key, "1", expiry).Err()
}

// IsRefreshTokenBlacklisted checks if a refresh token is blacklisted
func (s *AuthService) IsRefreshTokenBlacklisted(ctx context.Context, tokenString string) (bool, error) {
	if s.redis == nil {
		return false, nil
	}

	key := "blacklist:refresh:" + tokenString
	exists, err := s.redis.Exists(ctx, key).Result()
	if err != nil {
		return false, nil
	}

	return exists > 0, nil
}
