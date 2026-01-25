package repository

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// BidRepository handles bid database operations
type BidRepository struct {
	db *pgxpool.Pool
}

// NewBidRepository creates a new bid repository
func NewBidRepository(db *pgxpool.Pool) *BidRepository {
	return &BidRepository{db: db}
}

// Create creates a new bid
func (r *BidRepository) Create(ctx context.Context, bid *models.Bid) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO bids (auction_id, player_id, team_id, amount)
		VALUES ($1, $2, $3, $4)
		RETURNING id, bid_time
	`, bid.AuctionID, bid.PlayerID, bid.TeamID, bid.Amount).Scan(&bid.ID, &bid.BidTime)
}

// FindByPlayer returns all bids for a player
func (r *BidRepository) FindByPlayer(ctx context.Context, playerID uuid.UUID) ([]models.Bid, error) {
	rows, err := r.db.Query(ctx, `
		SELECT b.id, b.auction_id, b.player_id, b.team_id, b.amount, b.bid_time, b.is_winning,
			   t.name, t.short_name, t.color
		FROM bids b
		JOIN teams t ON b.team_id = t.id
		WHERE b.player_id = $1
		ORDER BY b.bid_time DESC
	`, playerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bids []models.Bid
	for rows.Next() {
		var b models.Bid
		var teamName, teamShort, teamColor string
		err := rows.Scan(
			&b.ID, &b.AuctionID, &b.PlayerID, &b.TeamID, &b.Amount, &b.BidTime, &b.IsWinning,
			&teamName, &teamShort, &teamColor,
		)
		if err != nil {
			return nil, err
		}
		b.Team = &models.Team{Name: teamName, ShortName: teamShort, Color: teamColor}
		bids = append(bids, b)
	}
	return bids, nil
}

// GetLastBid returns the last bid for an auction and player
func (r *BidRepository) GetLastBid(ctx context.Context, auctionID uuid.UUID, playerID uuid.UUID) (*models.Bid, error) {
	b := &models.Bid{}
	err := r.db.QueryRow(ctx, `
		SELECT id, auction_id, player_id, team_id, amount, bid_time
		FROM bids
		WHERE auction_id = $1 AND player_id = $2
		ORDER BY bid_time DESC
		LIMIT 1
	`, auctionID, playerID).Scan(&b.ID, &b.AuctionID, &b.PlayerID, &b.TeamID, &b.Amount, &b.BidTime)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// DeleteLastBid deletes the most recent bid for a player (for undo)
func (r *BidRepository) DeleteLastBid(ctx context.Context, auctionID uuid.UUID, playerID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM bids WHERE id = (
			SELECT id FROM bids WHERE auction_id = $1 AND player_id = $2 ORDER BY bid_time DESC LIMIT 1
		)
	`, auctionID, playerID)
	return err
}

// MarkWinning marks a bid as the winning bid
func (r *BidRepository) MarkWinning(ctx context.Context, bidID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "UPDATE bids SET is_winning = true WHERE id = $1", bidID)
	return err
}

// GetRecentBidsForAuction returns recent bids for an auction
func (r *BidRepository) GetRecentBidsForAuction(ctx context.Context, auctionID uuid.UUID, limit int) ([]models.Bid, error) {
	rows, err := r.db.Query(ctx, `
		SELECT b.id, b.player_id, b.team_id, b.amount, b.bid_time,
			   t.name, t.short_name, t.color
		FROM bids b
		JOIN teams t ON b.team_id = t.id
		WHERE b.auction_id = $1
		ORDER BY b.bid_time DESC
		LIMIT $2
	`, auctionID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bids []models.Bid
	for rows.Next() {
		var b models.Bid
		var teamName, teamShort, teamColor string
		err := rows.Scan(&b.ID, &b.PlayerID, &b.TeamID, &b.Amount, &b.BidTime, &teamName, &teamShort, &teamColor)
		if err != nil {
			return nil, err
		}
		b.Team = &models.Team{Name: teamName, ShortName: teamShort, Color: teamColor}
		bids = append(bids, b)
	}
	return bids, nil
}

// DeleteByPlayer deletes all bids for a specific player (used when skipping)
func (r *BidRepository) DeleteByPlayer(ctx context.Context, playerID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM bids WHERE player_id = $1", playerID)
	return err
}

// DeleteAll deletes all bids (for reset auction)
func (r *BidRepository) DeleteAll(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "DELETE FROM bids")
	return err
}

