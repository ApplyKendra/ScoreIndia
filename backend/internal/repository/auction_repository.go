package repository

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AuctionRepository handles auction database operations
type AuctionRepository struct {
	db *pgxpool.Pool
}

// NewAuctionRepository creates a new auction repository
func NewAuctionRepository(db *pgxpool.Pool) *AuctionRepository {
	return &AuctionRepository{db: db}
}

// GetCurrent returns the current/active auction
func (r *AuctionRepository) GetCurrent(ctx context.Context) (*models.Auction, error) {
	a := &models.Auction{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, season, status, current_player_id, current_bid, current_bidder_id,
			   timer_duration, timer_remaining, round, created_at, updated_at
		FROM auctions
		WHERE status IN ('live', 'paused', 'pending')
		ORDER BY created_at DESC
		LIMIT 1
	`).Scan(
		&a.ID, &a.Name, &a.Season, &a.Status, &a.CurrentPlayerID, &a.CurrentBid,
		&a.CurrentBidderID, &a.TimerDuration, &a.TimerRemaining, &a.Round,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}

// FindByID finds an auction by ID
func (r *AuctionRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Auction, error) {
	a := &models.Auction{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, season, status, current_player_id, current_bid, current_bidder_id,
			   timer_duration, timer_remaining, round, created_at, updated_at
		FROM auctions WHERE id = $1
	`, id).Scan(
		&a.ID, &a.Name, &a.Season, &a.Status, &a.CurrentPlayerID, &a.CurrentBid,
		&a.CurrentBidderID, &a.TimerDuration, &a.TimerRemaining, &a.Round,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}

// Create creates a new auction
func (r *AuctionRepository) Create(ctx context.Context, auction *models.Auction) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO auctions (name, season, status, timer_duration, round)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`, auction.Name, auction.Season, auction.Status, auction.TimerDuration, auction.Round).Scan(
		&auction.ID, &auction.CreatedAt, &auction.UpdatedAt,
	)
}

// Update updates auction state
func (r *AuctionRepository) Update(ctx context.Context, auction *models.Auction) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auctions SET 
			status = $2, current_player_id = $3, current_bid = $4, current_bidder_id = $5,
			timer_remaining = $6, round = $7, updated_at = NOW()
		WHERE id = $1
	`, auction.ID, auction.Status, auction.CurrentPlayerID, auction.CurrentBid,
		auction.CurrentBidderID, auction.TimerRemaining, auction.Round)
	return err
}

// UpdateCurrentBid updates the current bid info
func (r *AuctionRepository) UpdateCurrentBid(ctx context.Context, auctionID uuid.UUID, amount int64, bidderID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auctions SET 
			current_bid = $2, current_bidder_id = $3, updated_at = NOW()
		WHERE id = $1
	`, auctionID, amount, bidderID)
	return err
}

// SetCurrentPlayer sets the current player being auctioned
func (r *AuctionRepository) SetCurrentPlayer(ctx context.Context, auctionID, playerID uuid.UUID, basePrice int64) error {
	// Note: current_bid is set to NULL initially - first bid will be at base_price
	_, err := r.db.Exec(ctx, `
		UPDATE auctions SET 
			current_player_id = $2, current_bid = NULL, current_bidder_id = NULL, 
			timer_remaining = timer_duration, updated_at = NOW()
		WHERE id = $1
	`, auctionID, playerID)
	return err
}

// UpdateStatus updates auction status
func (r *AuctionRepository) UpdateStatus(ctx context.Context, auctionID uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auctions SET status = $2, updated_at = NOW() WHERE id = $1
	`, auctionID, status)
	return err
}

// ClearCurrentPlayer clears the current player after sale/unsold
func (r *AuctionRepository) ClearCurrentPlayer(ctx context.Context, auctionID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auctions SET 
			current_player_id = NULL, current_bid = NULL, current_bidder_id = NULL, updated_at = NOW()
		WHERE id = $1
	`, auctionID)
	return err
}

// DeleteCurrent deletes all active/paused auctions (for reset)
func (r *AuctionRepository) DeleteCurrent(ctx context.Context) error {
	// First, clear all foreign key references to players to avoid constraint violations
	_, err := r.db.Exec(ctx, "UPDATE auctions SET current_player_id = NULL, current_bidder_id = NULL WHERE status IN ('live', 'paused', 'pending')")
	if err != nil {
		return err
	}
	// Now delete the auctions
	_, err = r.db.Exec(ctx, "DELETE FROM auctions WHERE status IN ('live', 'paused', 'pending')")
	return err
}

// ClearAllPlayerReferences clears current_player_id from ALL auctions (for complete reset)
func (r *AuctionRepository) ClearAllPlayerReferences(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "UPDATE auctions SET current_player_id = NULL, current_bidder_id = NULL")
	return err
}

// DeleteAll deletes ALL auctions (for complete reset)
func (r *AuctionRepository) DeleteAll(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "DELETE FROM auctions")
	return err
}

