package services

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/google/uuid"
)

// PlayerService handles player operations
type PlayerService struct {
	repos *repository.Repositories
}

// NewPlayerService creates a new player service
func NewPlayerService(repos *repository.Repositories) *PlayerService {
	return &PlayerService{repos: repos}
}

// GetAll returns players with filters
func (s *PlayerService) GetAll(ctx context.Context, filter models.PlayerFilter) (*models.PaginatedResponse, error) {
	if filter.Limit == 0 {
		filter.Limit = 50
	}

	players, total, err := s.repos.Players.FindAll(ctx, filter)
	if err != nil {
		return nil, err
	}

	return &models.PaginatedResponse{
		Data:    players,
		Total:   total,
		Limit:   filter.Limit,
		Offset:  filter.Offset,
		HasMore: filter.Offset+len(players) < total,
	}, nil
}

// GetByID returns a player by ID
func (s *PlayerService) GetByID(ctx context.Context, id uuid.UUID) (*models.Player, error) {
	return s.repos.Players.FindByID(ctx, id)
}

// GetQueue returns the auction queue
func (s *PlayerService) GetQueue(ctx context.Context, limit int) ([]models.Player, error) {
	if limit == 0 {
		limit = 10
	}
	return s.repos.Players.GetQueue(ctx, limit)
}

// Create creates a new player
func (s *PlayerService) Create(ctx context.Context, req models.CreatePlayerRequest) (*models.Player, error) {
	player := &models.Player{
		Name:        req.Name,
		Country:     req.Country,
		CountryFlag: req.CountryFlag,
		Role:        req.Role,
		BasePrice:   req.BasePrice,
		Category:    "Set 1",
		Stats:       req.Stats,
		QueueOrder:  req.QueueOrder,
	}
	if req.ImageURL != "" {
		player.ImageURL = &req.ImageURL
	}
	if req.Category != "" {
		player.Category = req.Category
	}
	if player.Stats == nil {
		player.Stats = make(map[string]interface{})
	}

	if err := s.repos.Players.Create(ctx, player); err != nil {
		return nil, err
	}
	return player, nil
}

// Update updates a player
func (s *PlayerService) Update(ctx context.Context, id uuid.UUID, req models.UpdatePlayerRequest) (*models.Player, error) {
	player, err := s.repos.Players.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		player.Name = *req.Name
	}
	if req.Country != nil {
		player.Country = *req.Country
	}
	if req.CountryFlag != nil {
		player.CountryFlag = *req.CountryFlag
	}
	if req.Role != nil {
		player.Role = *req.Role
	}
	if req.BasePrice != nil {
		player.BasePrice = *req.BasePrice
	}
	if req.Category != nil {
		player.Category = *req.Category
	}
	if req.ImageURL != nil {
		player.ImageURL = req.ImageURL
	}
	if req.Stats != nil {
		player.Stats = req.Stats
	}
	if req.QueueOrder != nil {
		player.QueueOrder = req.QueueOrder
	}

	if err := s.repos.Players.Update(ctx, player); err != nil {
		return nil, err
	}
	return player, nil
}

// Delete deletes a player
func (s *PlayerService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repos.Players.Delete(ctx, id)
}

// GetTopBuys returns top purchases
func (s *PlayerService) GetTopBuys(ctx context.Context, limit int) ([]models.Player, error) {
	if limit == 0 {
		limit = 10
	}
	return s.repos.Players.GetTopBuys(ctx, limit)
}

// GetRecentSales returns recent sales
func (s *PlayerService) GetRecentSales(ctx context.Context, limit int) ([]models.Player, error) {
	if limit == 0 {
		limit = 10
	}
	return s.repos.Players.GetRecentSales(ctx, limit)
}
