package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repositories holds all repository instances
type Repositories struct {
	Users    *UserRepository
	Teams    *TeamRepository
	Players  *PlayerRepository
	Auctions *AuctionRepository
	Bids     *BidRepository
	Settings *SettingsRepository
	db       *pgxpool.Pool
}

// NewRepositories creates all repository instances
func NewRepositories(db *pgxpool.Pool) *Repositories {
	return &Repositories{
		Users:    NewUserRepository(db),
		Teams:    NewTeamRepository(db),
		Players:  NewPlayerRepository(db),
		Auctions: NewAuctionRepository(db),
		Bids:     NewBidRepository(db),
		Settings: NewSettingsRepository(db),
		db:       db,
	}
}

// GetDB returns the database pool
func (r *Repositories) GetDB() *pgxpool.Pool {
	return r.db
}
