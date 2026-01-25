package handlers

import (
	"github.com/auctionapp/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetTeams returns all teams
func (h *Handlers) GetTeams(c *fiber.Ctx) error {
	teams, err := h.services.Teams.GetAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(teams)
}

// GetTeam returns a team by ID
func (h *Handlers) GetTeam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	team, err := h.services.Teams.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Team not found",
		})
	}
	return c.JSON(team)
}

// GetTeamSquad returns a team's players
func (h *Handlers) GetTeamSquad(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	players, err := h.services.Teams.GetSquad(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(players)
}

// CreateTeam creates a new team
func (h *Handlers) CreateTeam(c *fiber.Ctx) error {
	var req models.CreateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	team, err := h.services.Teams.Create(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON(team)
}

// UpdateTeam updates a team
func (h *Handlers) UpdateTeam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	var req models.UpdateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	team, err := h.services.Teams.Update(c.Context(), id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(team)
}

// DeleteTeam deletes a team
func (h *Handlers) DeleteTeam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	if err := h.services.Teams.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"message": "Team deleted"})
}
