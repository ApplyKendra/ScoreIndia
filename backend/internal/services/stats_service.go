package services

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
)

// StatsService handles statistics operations
type StatsService struct {
	repos *repository.Repositories
}

// NewStatsService creates a new stats service
func NewStatsService(repos *repository.Repositories) *StatsService {
	return &StatsService{repos: repos}
}

// GetOverview returns dashboard overview stats
func (s *StatsService) GetOverview(ctx context.Context) (*models.OverviewStats, error) {
	stats := &models.OverviewStats{}

	var err error
	stats.TotalTeams, err = s.repos.Teams.Count(ctx)
	if err != nil {
		return nil, err
	}

	stats.TotalPlayers, err = s.repos.Players.Count(ctx)
	if err != nil {
		return nil, err
	}

	stats.RegisteredBidders, err = s.repos.Users.CountByRole(ctx, "bidder")
	if err != nil {
		return nil, err
	}

	stats.TotalAuctionValue, err = s.repos.Players.GetTotalSoldValue(ctx)
	if err != nil {
		return nil, err
	}

	stats.SoldPlayers, err = s.repos.Players.CountByStatus(ctx, "sold")
	if err != nil {
		return nil, err
	}

	stats.UnsoldPlayers, err = s.repos.Players.CountByStatus(ctx, "unsold")
	if err != nil {
		return nil, err
	}

	stats.AvailablePlayers, err = s.repos.Players.CountByStatus(ctx, "available")
	if err != nil {
		return nil, err
	}

	return stats, nil
}
