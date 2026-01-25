package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// RequireJSONOrMultipart middleware enforces Content-Type for POST/PUT/PATCH requests
// Allows application/json and multipart/form-data (for file uploads)
func RequireJSONOrMultipart(c *fiber.Ctx) error {
	method := c.Method()
	if method == "POST" || method == "PUT" || method == "PATCH" {
		contentType := c.Get("Content-Type")
		// Allow JSON or multipart/form-data (for file uploads)
		if !strings.HasPrefix(contentType, "application/json") && 
		   !strings.HasPrefix(contentType, "multipart/form-data") {
			return c.Status(fiber.StatusUnsupportedMediaType).JSON(fiber.Map{
				"error": "Content-Type must be application/json or multipart/form-data",
			})
		}
	}
	return c.Next()
}
