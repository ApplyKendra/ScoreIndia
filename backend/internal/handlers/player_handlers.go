package handlers

import (
	"github.com/auctionapp/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetPlayers returns players with filters
func (h *Handlers) GetPlayers(c *fiber.Ctx) error {
	filter := models.PlayerFilter{
		Status:   c.Query("status"),
		Role:     c.Query("role"),
		Category: c.Query("category"),
		TeamID:   c.Query("team_id"),
		Search:   c.Query("search"),
		Limit:    c.QueryInt("limit", 50),
		Offset:   c.QueryInt("offset", 0),
	}

	resp, err := h.services.Players.GetAll(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(resp)
}

// GetPlayer returns a player by ID
func (h *Handlers) GetPlayer(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid player ID",
		})
	}

	player, err := h.services.Players.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Player not found",
		})
	}
	return c.JSON(player)
}

// GetPlayerQueue returns the auction queue
func (h *Handlers) GetPlayerQueue(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 10)
	queue, err := h.services.Players.GetQueue(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(queue)
}

// CreatePlayer creates a new player
func (h *Handlers) CreatePlayer(c *fiber.Ctx) error {
	var req models.CreatePlayerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	player, err := h.services.Players.Create(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON(player)
}

// UpdatePlayer updates a player
func (h *Handlers) UpdatePlayer(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid player ID",
		})
	}

	var req models.UpdatePlayerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	player, err := h.services.Players.Update(c.Context(), id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(player)
}

// DeletePlayer deletes a player
func (h *Handlers) DeletePlayer(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid player ID",
		})
	}

	if err := h.services.Players.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"message": "Player deleted"})
}

// ImportPlayers handles bulk player import
func (h *Handlers) ImportPlayers(c *fiber.Ctx) error {
	// TODO: Implement CSV import
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "CSV import not yet implemented",
	})
}
