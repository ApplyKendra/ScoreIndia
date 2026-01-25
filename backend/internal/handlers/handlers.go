package handlers

import (
	"github.com/auctionapp/backend/internal/config"
	"github.com/auctionapp/backend/internal/services"
	"github.com/auctionapp/backend/internal/websocket"
	"github.com/gofiber/fiber/v2"
)

// Handlers holds all HTTP handlers
type Handlers struct {
	services *services.Services
	hub      *websocket.Hub
	cfg      *config.Config
}

// NewHandlers creates a new handlers instance
func NewHandlers(svc *services.Services, hub *websocket.Hub, cfg *config.Config) *Handlers {
	return &Handlers{
		services: svc,
		hub:      hub,
		cfg:      cfg,
	}
}

// ErrorHandler is a custom error handler for Fiber
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	} else {
		message = err.Error()
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   message,
		"success": false,
	})
}
