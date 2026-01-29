package models

// LoginRequest represents login credentials
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// LoginResponse contains authentication tokens
type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	User         *User  `json:"user"`
}

// CreateUserRequest for creating new users
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Name     string `json:"name" validate:"required"`
	Role     string `json:"role" validate:"required,oneof=admin host bidder viewer"`
	TeamID   string `json:"team_id,omitempty"`
}

// UpdateUserRequest for updating users
type UpdateUserRequest struct {
	Email  *string `json:"email,omitempty" validate:"omitempty,email"`
	Name   *string `json:"name,omitempty"`
	Role   *string `json:"role,omitempty" validate:"omitempty,oneof=admin host bidder viewer"`
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=active pending suspended"`
	TeamID *string `json:"team_id,omitempty"`
}

// CreateTeamRequest for creating teams
type CreateTeamRequest struct {
	Name       string `json:"name" validate:"required"`
	ShortName  string `json:"short_name" validate:"required,max=10"`
	Color      string `json:"color" validate:"required"`
	LogoURL    string `json:"logo_url,omitempty"`
	Budget     int64  `json:"budget" validate:"required,gt=0"`
	MaxPlayers int    `json:"max_players,omitempty"`
	MaxForeign int    `json:"max_foreign,omitempty"`
}

// UpdateTeamRequest for updating teams
type UpdateTeamRequest struct {
	Name       *string `json:"name,omitempty"`
	ShortName  *string `json:"short_name,omitempty"`
	Color      *string `json:"color,omitempty"`
	LogoURL    *string `json:"logo_url,omitempty"`
	Budget     *int64  `json:"budget,omitempty"`
	MaxPlayers *int    `json:"max_players,omitempty"`
	MaxForeign *int    `json:"max_foreign,omitempty"`
}

// CreatePlayerRequest for creating players
type CreatePlayerRequest struct {
	Name        string                 `json:"name" validate:"required"`
	Country     string                 `json:"country" validate:"required"`
	CountryFlag string                 `json:"country_flag"`
	Role        string                 `json:"role" validate:"required,oneof=Batsman Bowler All-rounder Wicketkeeper"`
	BasePrice   int64                  `json:"base_price" validate:"required,gt=0"`
	Category    string                 `json:"category,omitempty"`
	ImageURL    string                 `json:"image_url,omitempty"`
	Stats       map[string]interface{} `json:"stats,omitempty"`
	QueueOrder  *int                   `json:"queue_order,omitempty"`
}

// UpdatePlayerRequest for updating players
type UpdatePlayerRequest struct {
	Name        *string                `json:"name,omitempty"`
	Country     *string                `json:"country,omitempty"`
	CountryFlag *string                `json:"country_flag,omitempty"`
	Role        *string                `json:"role,omitempty"`
	BasePrice   *int64                 `json:"base_price,omitempty"`
	Category    *string                `json:"category,omitempty"`
	ImageURL    *string                `json:"image_url,omitempty"`
	Stats       map[string]interface{} `json:"stats,omitempty"`
	Status      *string                `json:"status,omitempty"`
	QueueOrder  *int                   `json:"queue_order,omitempty"`
}

// PlaceBidRequest for placing a bid
type PlaceBidRequest struct {
	Amount int64 `json:"amount" validate:"required,gt=0"`
}

// PlaceBidForTeamRequest for host/admin to place bid on behalf of a team
type PlaceBidForTeamRequest struct {
	TeamID string `json:"team_id" validate:"required"`
	Amount int64  `json:"amount" validate:"required,gt=0"`
}

// PlayerFilter for filtering players
type PlayerFilter struct {
	Status   string `query:"status"`
	Role     string `query:"role"`
	Category string `query:"category"`
	TeamID   string `query:"team_id"`
	Search   string `query:"search"`
	Limit    int    `query:"limit"`
	Offset   int    `query:"offset"`
}

// PaginatedResponse for paginated API responses
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Limit      int         `json:"limit"`
	Offset     int         `json:"offset"`
	HasMore    bool        `json:"has_more"`
}

// OverviewStats for dashboard
type OverviewStats struct {
	TotalTeams       int   `json:"total_teams"`
	TotalPlayers     int   `json:"total_players"`
	RegisteredBidders int  `json:"registered_bidders"`
	TotalAuctionValue int64 `json:"total_auction_value"`
	SoldPlayers      int   `json:"sold_players"`
	UnsoldPlayers    int   `json:"unsold_players"`
	AvailablePlayers int   `json:"available_players"`
}

// RetainedPlayer represents a player being retained with a badge
type RetainedPlayer struct {
	PlayerID string `json:"player_id" validate:"required"`
	Badge    string `json:"badge,omitempty"`
}

// RetainPlayersRequest for retaining players to a team
type RetainPlayersRequest struct {
	Players []RetainedPlayer `json:"players" validate:"required"`
}
