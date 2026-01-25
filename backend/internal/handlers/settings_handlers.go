package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// GetSettings returns all settings
func (h *Handlers) GetSettings(c *fiber.Ctx) error {
	settings, err := h.services.Settings.GetAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(settings)
}

// UpdateSettings updates settings
func (h *Handlers) UpdateSettings(c *fiber.Ctx) error {
	var settings map[string]interface{}
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.services.Settings.Update(c.Context(), settings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"message": "Settings updated"})
}

// GetOverviewStats returns dashboard stats
func (h *Handlers) GetOverviewStats(c *fiber.Ctx) error {
	stats, err := h.services.Stats.GetOverview(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(stats)
}

// GetTopBuys returns top purchases
func (h *Handlers) GetTopBuys(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 10)
	players, err := h.services.Players.GetTopBuys(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(players)
}

// GetRecentSales returns recent sales
func (h *Handlers) GetRecentSales(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 10)
	players, err := h.services.Players.GetRecentSales(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(players)
}

// GetStreamUrl returns the current YouTube stream URL (public endpoint)
func (h *Handlers) GetStreamUrl(c *fiber.Ctx) error {
	url, err := h.services.Settings.Get(c.Context(), "youtube_stream_url")
	if err != nil {
		// Return empty string if not set
		return c.JSON(fiber.Map{"url": ""})
	}
	urlStr, ok := url.(string)
	if !ok {
		return c.JSON(fiber.Map{"url": ""})
	}
	return c.JSON(fiber.Map{"url": urlStr})
}

// SetStreamUrl sets the YouTube stream URL and broadcasts to all viewers
func (h *Handlers) SetStreamUrl(c *fiber.Ctx) error {
	var body struct {
		Url string `json:"url"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Save to database
	settings := map[string]interface{}{
		"youtube_stream_url": body.Url,
	}
	if err := h.services.Settings.Update(c.Context(), settings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast to all WebSocket clients (including public viewers)
	h.hub.BroadcastAll("auction:stream-url", fiber.Map{"url": body.Url})

	return c.JSON(fiber.Map{"message": "Stream URL updated", "url": body.Url})
}
