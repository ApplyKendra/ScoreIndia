package middleware

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/auctionapp/backend/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

// JWTAuth middleware validates JWT tokens
func JWTAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var token string

		// 1. Try Authorization header
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				token = parts[1]
			}
		}

		// 2. Try Cookie if header failed
		if token == "" {
			token = c.Cookies("access_token")
		}

		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization",
			})
		}
		claims, err := utils.ValidateJWT(token, secret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Store claims in context
		c.Locals("userID", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)
		c.Locals("teamID", claims.TeamID)

		return c.Next()
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Role not found in token",
			})
		}

		// Super admin can access everything
		if userRole == "super_admin" {
			return c.Next()
		}

		// Check if user role matches any required role
		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions",
		})
	}
}

// RateLimit creates a Redis-based rate limiting middleware
// maxRequests: maximum number of requests allowed in the window
// windowSeconds: time window in seconds
func RateLimit(redisClient *redis.Client, maxRequests int, windowSeconds int) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// If Redis is not available, allow the request (fail-open for availability)
		if redisClient == nil {
			return c.Next()
		}

		// Create a rate limit key based on IP and path
		ip := c.IP()
		path := c.Path()
		key := fmt.Sprintf("ratelimit:%s:%s", path, ip)
		
		ctx := context.Background()

		// Increment the counter
		count, err := redisClient.Incr(ctx, key).Result()
		if err != nil {
			// On Redis error, allow the request (fail-open)
			return c.Next()
		}

		// Set expiration on first request
		if count == 1 {
			redisClient.Expire(ctx, key, time.Duration(windowSeconds)*time.Second)
		}

		// Check if rate limit exceeded
		if count > int64(maxRequests) {
			c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Set("X-RateLimit-Remaining", "0")
			c.Set("Retry-After", fmt.Sprintf("%d", windowSeconds))
			
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests. Please try again later.",
			})
		}

		// Set rate limit headers
		c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
		c.Set("X-RateLimit-Remaining", fmt.Sprintf("%d", maxRequests-int(count)))

		return c.Next()
	}
}

// LoginRateLimit is a specialized rate limiter for login attempts (stricter limits)
func LoginRateLimit(redisClient *redis.Client) fiber.Handler {
	// 5 login attempts per minute per IP
	return RateLimit(redisClient, 5, 60)
}

// APIRateLimit is a general rate limiter for API requests
func APIRateLimit(redisClient *redis.Client) fiber.Handler {
	// 100 requests per minute per IP
	return RateLimit(redisClient, 100, 60)
}
