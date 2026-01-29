package handlers

import (
	"github.com/auctionapp/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetAuctionState returns the current auction state
func (h *Handlers) GetAuctionState(c *fiber.Ctx) error {
	state, err := h.services.Auction.GetState(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(state)
}

// StartAuction starts or resumes an auction
func (h *Handlers) StartAuction(c *fiber.Ctx) error {
	auction, err := h.services.Auction.StartAuction(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast to all clients
	h.hub.Broadcast <- []byte(`{"event":"auction:started"}`)

	return c.JSON(auction)
}

// PauseAuction pauses the auction
func (h *Handlers) PauseAuction(c *fiber.Ctx) error {
	if err := h.services.Auction.PauseAuction(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast pause event
	h.hub.Broadcast <- []byte(`{"event":"auction:paused"}`)

	// Broadcast full state for immediate synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Auction paused"})
}

// ResumeAuction resumes a paused auction
func (h *Handlers) ResumeAuction(c *fiber.Ctx) error {
	if err := h.services.Auction.ResumeAuction(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast resume event
	h.hub.Broadcast <- []byte(`{"event":"auction:resumed"}`)

	// Broadcast full state for immediate synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Auction resumed"})
}



// EndAuction ends the auction
func (h *Handlers) EndAuction(c *fiber.Ctx) error {
	if err := h.services.Auction.EndAuction(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get updated state first (with completed status)
	state, _ := h.services.Auction.GetState(c.Context())

	// Broadcast end event with proper format
	h.hub.BroadcastJSON("auction:ended", fiber.Map{
		"status": "completed",
	})

	// Broadcast full state for immediate synchronization (this ensures status is "completed")
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Auction ended"})
}

// NextPlayer moves to the next player
func (h *Handlers) NextPlayer(c *fiber.Ctx) error {
	player, err := h.services.Auction.NextPlayer(c.Context())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast new player to all clients
	h.hub.BroadcastJSON("auction:player-changed", player)

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(player)
}

// StartBidForPlayer starts bidding on a specific player selected by host
func (h *Handlers) StartBidForPlayer(c *fiber.Ctx) error {
	playerID, err := uuid.Parse(c.Params("playerId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid player ID",
		})
	}

	player, err := h.services.Auction.StartBidForPlayer(c.Context(), playerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast new player to all clients
	h.hub.BroadcastJSON("auction:player-changed", player)

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(player)
}

// SellPlayer marks the current player as sold
func (h *Handlers) SellPlayer(c *fiber.Ctx) error {
	player, team, err := h.services.Auction.SellPlayer(c.Context())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast sale to all clients
	h.hub.BroadcastJSON("auction:sold", fiber.Map{
		"player": player,
		"team":   team,
		"amount": player.SoldPrice,
	})

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{
		"message": "Player sold",
		"player":  player,
		"team":    team,
	})
}

// SellToTeam manually allocates the current player to a specific team (for tie-breaking at max bid)
func (h *Handlers) SellToTeam(c *fiber.Ctx) error {
	teamID, err := uuid.Parse(c.Params("teamId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	player, team, err := h.services.Auction.SellToTeam(c.Context(), teamID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast sale to all clients
	h.hub.BroadcastJSON("auction:sold", fiber.Map{
		"player": player,
		"team":   team,
		"amount": player.SoldPrice,
	})

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{
		"message": "Player sold (manual allocation)",
		"player":  player,
		"team":    team,
	})
}

// MarkUnsold marks the current player as unsold
func (h *Handlers) MarkUnsold(c *fiber.Ctx) error {
	player, err := h.services.Auction.MarkUnsold(c.Context())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.hub.BroadcastJSON("auction:unsold", fiber.Map{"player": player})

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Player marked unsold", "player": player})
}

// SkipPlayer skips the current player and returns them to the queue
func (h *Handlers) SkipPlayer(c *fiber.Ctx) error {
	player, err := h.services.Auction.SkipPlayer(c.Context())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.hub.BroadcastJSON("auction:skipped", fiber.Map{"player": player})

	// Broadcast full state for synchronization
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Player skipped and returned to queue", "player": player})
}


// ResetTimer resets the bid timer
func (h *Handlers) ResetTimer(c *fiber.Ctx) error {
	remaining, err := h.services.Auction.ResetTimer(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.hub.BroadcastJSON("auction:timer", fiber.Map{"remaining": remaining})

	return c.JSON(fiber.Map{"remaining": remaining})
}

// UndoBid removes the last bid
func (h *Handlers) UndoBid(c *fiber.Ctx) error {
	if err := h.services.Auction.UndoBid(c.Context()); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get updated state and broadcast
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Last bid undone"})
}

// PlaceBid places a bid
func (h *Handlers) PlaceBid(c *fiber.Ctx) error {
	teamID, ok := c.Locals("teamID").(*uuid.UUID)
	if !ok || teamID == nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "No team assigned to this bidder",
		})
	}

	var req models.PlaceBidRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	bid, err := h.services.Auction.PlaceBid(c.Context(), *teamID, req.Amount, false, false)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast bid to all clients
	h.hub.BroadcastJSON("auction:bid", bid)

	return c.JSON(bid)
}

// PlaceBidForTeam allows host/admin to place a bid on behalf of a team
func (h *Handlers) PlaceBidForTeam(c *fiber.Ctx) error {
	var req models.PlaceBidForTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid team ID",
		})
	}

	// Skip bidder check and freeze check for host/admin placed bids
	bid, err := h.services.Auction.PlaceBid(c.Context(), teamID, req.Amount, true, true)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast bid to all clients
	h.hub.BroadcastJSON("auction:bid", bid)

	return c.JSON(bid)
}

// ToggleBidderBidding toggles the bidder bidding disabled state
func (h *Handlers) ToggleBidderBidding(c *fiber.Ctx) error {
	var req struct {
		Disabled bool `json:"disabled"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Set the disabled state in Redis
	h.services.Auction.SetBidderBiddingDisabled(c.Context(), req.Disabled)

	// Broadcast updated state to all clients
	state, _ := h.services.Auction.GetState(c.Context())
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{
		"disabled": req.Disabled,
		"message":  "Bidder bidding state updated",
	})
}

// GetBidHistory returns bid history for a player
func (h *Handlers) GetBidHistory(c *fiber.Ctx) error {
	playerID, err := uuid.Parse(c.Params("playerId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid player ID",
		})
	}

	bids, err := h.services.Auction.GetBidHistory(c.Context(), playerID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(bids)
}

// ResetAuction resets the entire auction - clears all bids, player statuses, team spent amounts
func (h *Handlers) ResetAuction(c *fiber.Ctx) error {
	if err := h.services.Auction.ResetAuction(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast reset to all clients
	h.hub.BroadcastJSON("auction:reset", fiber.Map{"message": "Auction has been reset"})

	return c.JSON(fiber.Map{"message": "Auction reset successfully"})
}

// BroadcastLive broadcasts to all clients that the auction is now live
func (h *Handlers) BroadcastLive(c *fiber.Ctx) error {
	// Update auction status to live
	if err := h.services.Auction.SetLiveStatus(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get current state
	state, _ := h.services.Auction.GetState(c.Context())

	// Broadcast live announcement to all clients
	h.hub.BroadcastJSON("auction:live", fiber.Map{
		"message": "Auction is now live! Owners are preparing. Waiting for the first player to appear.",
		"status":  "live",
	})

	// Also broadcast full state
	h.hub.BroadcastJSON("auction:state", state)

	return c.JSON(fiber.Map{"message": "Broadcast sent - auction is now live"})
}

// ResetEverything completely resets the entire system - deletes all teams, players, bids, and auctions
func (h *Handlers) ResetEverything(c *fiber.Ctx) error {
	if err := h.services.Auction.ResetEverything(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Broadcast reset to all clients
	h.hub.BroadcastJSON("auction:reset-everything", fiber.Map{"message": "Entire system has been reset"})

	return c.JSON(fiber.Map{"message": "System reset successfully - all teams, players, and auctions deleted"})
}

