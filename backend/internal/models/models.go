package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a system user
type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"` // Never expose
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	TeamID       *uuid.UUID `json:"team_id,omitempty"`
	Status       string     `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	
	// Joined fields
	Team         *Team      `json:"team,omitempty"`
}

// Team represents an auction team
type Team struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	ShortName  string    `json:"short_name"`
	Color      string    `json:"color"`
	LogoURL    *string   `json:"logo_url,omitempty"`
	Budget     int64     `json:"budget"`
	Spent      int64     `json:"spent"`
	MaxPlayers int       `json:"max_players"`
	MaxForeign int       `json:"max_foreign"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Computed fields
	RemainingBudget int64 `json:"remaining_budget,omitempty"`
	PlayerCount     int   `json:"player_count,omitempty"`
	ForeignCount    int   `json:"foreign_count,omitempty"`
}

// Player represents a player in the auction pool
type Player struct {
	ID          uuid.UUID              `json:"id"`
	Name        string                 `json:"name"`
	Country     string                 `json:"country"`
	CountryFlag string                 `json:"country_flag"`
	Role        string                 `json:"role"`
	BasePrice   int64                  `json:"base_price"`
	Category    string                 `json:"category"`
	ImageURL    *string                `json:"image_url,omitempty"`
	Stats       map[string]interface{} `json:"stats"`
	Status      string                 `json:"status"`
	SoldPrice   *int64                 `json:"sold_price,omitempty"`
	TeamID      *uuid.UUID             `json:"team_id,omitempty"`
	SoldAt      *time.Time             `json:"sold_at,omitempty"`
	QueueOrder  *int                   `json:"queue_order,omitempty"`
	Badge       *string                `json:"badge,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`

	// Joined fields
	Team        *Team                  `json:"team,omitempty"`
}

// Auction represents an auction session
type Auction struct {
	ID              uuid.UUID  `json:"id"`
	Name            string     `json:"name"`
	Season          string     `json:"season"`
	Status          string     `json:"status"`
	CurrentPlayerID *uuid.UUID `json:"current_player_id,omitempty"`
	CurrentBid      *int64     `json:"current_bid,omitempty"`
	CurrentBidderID *uuid.UUID `json:"current_bidder_id,omitempty"`
	TimerDuration   int        `json:"timer_duration"`
	TimerRemaining  *int       `json:"timer_remaining,omitempty"`
	Round           int        `json:"round"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Joined fields
	CurrentPlayer   *Player    `json:"current_player,omitempty"`
	CurrentBidder   *Team      `json:"current_bidder,omitempty"`
}

// Bid represents a single bid
type Bid struct {
	ID        uuid.UUID `json:"id"`
	AuctionID uuid.UUID `json:"auction_id"`
	PlayerID  uuid.UUID `json:"player_id"`
	TeamID    uuid.UUID `json:"team_id"`
	Amount    int64     `json:"amount"`
	BidTime   time.Time `json:"bid_time"`
	IsWinning bool      `json:"is_winning"`

	// Joined fields
	Team      *Team     `json:"team,omitempty"`
}

// Setting represents a key-value setting
type Setting struct {
	Key       string      `json:"key"`
	Value     interface{} `json:"value"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// AuctionState represents the complete live auction state
type AuctionState struct {
	Auction       *Auction  `json:"auction"`
	Status        string    `json:"status"` // Top-level status for frontend compatibility
	CurrentPlayer *Player   `json:"current_player"`
	CurrentBidder *Team     `json:"current_bidder"`
	CurrentBid    *int64    `json:"current_bid"`
	BidHistory    []Bid     `json:"bids"`
	Teams         []Team    `json:"teams"`
	QueueNext     []Player  `json:"queue_next"`
	TimerRunning          bool      `json:"timer_running"`
	BidFrozen             bool      `json:"bid_frozen"`
	BidderBiddingDisabled bool      `json:"bidder_bidding_disabled"`
	TiedTeams             []Team    `json:"tied_teams,omitempty"` // Teams that bid 50000 (max) - for tie-breaking
}
