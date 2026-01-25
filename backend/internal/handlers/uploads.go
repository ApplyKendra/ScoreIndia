package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Allowed image MIME types
var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// Max file size (20MB)
const maxFileSize = 20 * 1024 * 1024

// UploadImage handles image file uploads
func (h *Handlers) UploadImage(c *fiber.Ctx) error {
	// Get uploaded file
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No image file provided",
		})
	}

	// Validate file size
	if file.Size > maxFileSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size exceeds 20MB limit",
		})
	}

	// Validate MIME type
	contentType := file.Header.Get("Content-Type")
	if !allowedMimeTypes[contentType] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
		})
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	if ext == "" {
		// Infer extension from content type
		switch contentType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		case "image/gif":
			ext = ".gif"
		}
	}
	filename := fmt.Sprintf("%s%s", uuid.New().String(), strings.ToLower(ext))

	// Ensure uploads directory exists
	uploadDir := "./uploads/images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create upload directory",
		})
	}

	// Save file
	destPath := filepath.Join(uploadDir, filename)
	
	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read uploaded file",
		})
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(destPath)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}
	defer dst.Close()

	// Copy file contents
	if _, err := io.Copy(dst, src); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Return the URL path
	imageURL := fmt.Sprintf("/uploads/images/%s", filename)
	
	return c.JSON(fiber.Map{
		"url":      imageURL,
		"filename": filename,
	})
}
