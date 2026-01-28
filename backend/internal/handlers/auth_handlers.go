package handlers

import (
	"os"
	"strings"
	"time"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Login handles user authentication
func (h *Handlers) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	resp, err := h.services.Auth.Login(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Set cookies
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    resp.AccessToken,
		HTTPOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   resp.ExpiresIn,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    resp.RefreshToken,
		HTTPOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		SameSite: "Lax",
		Path:     "/auth/refresh", // Restrict path
		MaxAge:   7 * 24 * 60 * 60, // Default max, logic handled by JWT exp
	})

	// Don't send tokens in body
	resp.AccessToken = ""
	resp.RefreshToken = ""

	return c.JSON(resp)
}

// Logout handles user logout
func (h *Handlers) Logout(c *fiber.Ctx) error {
	// Get tokens from cookies or headers
	var accessToken, refreshToken string

	// Get access token
	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			accessToken = parts[1]
		}
	}
	if accessToken == "" {
		accessToken = c.Cookies("access_token")
	}

	// Get refresh token
	refreshToken = c.Cookies("refresh_token")

	// Blacklist tokens if they exist
	if accessToken != "" {
		// Parse token to get expiry
		if claims, err := utils.ValidateJWT(accessToken, h.cfg.JWTSecret); err == nil {
			// Calculate remaining time until expiry
			if claims.ExpiresAt != nil {
				expiryTime := claims.ExpiresAt.Time
				remainingMinutes := int(time.Until(expiryTime).Minutes())
				if remainingMinutes > 0 {
					h.services.Auth.BlacklistToken(c.Context(), accessToken, remainingMinutes)
				}
			}
		}
	}

	if refreshToken != "" {
		// Parse refresh token once to get both validity and expiry
		if token, parseErr := jwt.ParseWithClaims(refreshToken, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(h.cfg.JWTSecret), nil
		}); parseErr == nil && token.Valid {
			if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && claims.ExpiresAt != nil {
				expiryTime := claims.ExpiresAt.Time
				remainingMinutes := int(time.Until(expiryTime).Minutes())
				if remainingMinutes > 0 {
					h.services.Auth.BlacklistRefreshToken(c.Context(), refreshToken, remainingMinutes)
				}
			}
		}
	}

	// Clear cookies
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		HTTPOnly: true,
		Expires:  time.Now().Add(-1 * time.Hour),
		MaxAge:   -1,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HTTPOnly: true,
		Expires:  time.Now().Add(-1 * time.Hour),
		MaxAge:   -1,
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// RefreshToken generates new tokens from refresh token
func (h *Handlers) RefreshToken(c *fiber.Ctx) error {
	var token string
	
	// Try getting from cookie first
	token = c.Cookies("refresh_token")
	
	// Fallback to body if needed (optional)
	if token == "" {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := c.BodyParser(&req); err == nil {
			token = req.RefreshToken
		}
	}

	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Refresh token required",
		})
	}

	resp, err := h.services.Auth.RefreshToken(c.Context(), token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Set new cookies
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    resp.AccessToken,
		HTTPOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   resp.ExpiresIn,
	})

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    resp.RefreshToken,
		HTTPOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		SameSite: "Lax",
		Path:     "/auth/refresh",
		MaxAge:   7 * 24 * 60 * 60,
	})

	// Don't send tokens in body
	resp.AccessToken = ""
	resp.RefreshToken = ""

	return c.JSON(resp)
}

// GetCurrentUser returns the authenticated user
func (h *Handlers) GetCurrentUser(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User ID not found",
		})
	}

	user, err := h.services.Auth.GetCurrentUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user)
}

// ChangePassword handles password change for authenticated users
func (h *Handlers) ChangePassword(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User ID not found",
		})
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Current password and new password are required",
		})
	}

	err := h.services.Auth.ChangePassword(c.Context(), userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password changed successfully",
	})
}
