package services

import (
	"context"
	"errors"

	"github.com/auctionapp/backend/internal/config"
	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/auctionapp/backend/internal/utils"
	"github.com/google/uuid"
)

// AuthService handles authentication operations
type AuthService struct {
	repos *repository.Repositories
	cfg   *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(repos *repository.Repositories, cfg *config.Config) *AuthService {
	return &AuthService{repos: repos, cfg: cfg}
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
