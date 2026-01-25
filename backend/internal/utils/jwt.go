package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID uuid.UUID  `json:"user_id"`
	Email  string     `json:"email"`
	Role   string     `json:"role"`
	TeamID *uuid.UUID `json:"team_id,omitempty"`
	jwt.RegisteredClaims
}

// GetTokenExpirations returns the access and refresh token duration in minutes based on role
func GetTokenExpirations(role string) (accessMinutes int, refreshMinutes int) {
	switch role {
	case "bidder":
		// Bidder: 6 hrs idle, 36 hrs max
		return 6 * 60, 36 * 60
	case "host":
		// Host: 6 hrs idle, 24 hrs max
		return 6 * 60, 24 * 60
	case "admin", "super_admin":
		// Admin: 30 min idle, 8 hrs max
		return 30, 8 * 60
	default:
		// Default: 2 hrs, 24 hrs
		return 120, 24 * 60
	}
}

// GenerateJWT generates a new JWT token
func GenerateJWT(userID uuid.UUID, email, role string, teamID *uuid.UUID, secret string, expiryMinutes int) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		TeamID: teamID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateRefreshToken generates a refresh token with longer expiry
func GenerateRefreshToken(userID uuid.UUID, secret string, expiryMinutes int) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryMinutes) * time.Minute)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   userID.String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// ValidateRefreshToken validates a refresh token and returns the user ID
func ValidateRefreshToken(tokenString, secret string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return uuid.Parse(claims.Subject)
	}

	return uuid.Nil, errors.New("invalid refresh token")
}
