package services

import (
	"github.com/auctionapp/backend/internal/config"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/redis/go-redis/v9"
)

// Services holds all service instances
type Services struct {
	Auth     *AuthService
	Teams    *TeamService
	Players  *PlayerService
	Auction  *AuctionService
	Users    *UserService
	Settings *SettingsService
	Stats    *StatsService
}

// NewServices creates all service instances
func NewServices(repos *repository.Repositories, redis *redis.Client, cfg *config.Config) *Services {
	return &Services{
		Auth:     NewAuthService(repos, cfg),
		Teams:    NewTeamService(repos),
		Players:  NewPlayerService(repos),
		Auction:  NewAuctionService(repos, redis),
		Users:    NewUserService(repos),
		Settings: NewSettingsService(repos),
		Stats:    NewStatsService(repos),
	}
}
