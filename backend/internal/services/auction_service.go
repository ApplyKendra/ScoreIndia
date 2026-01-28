package services

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// AuctionService handles auction operations
type AuctionService struct {
	repos       *repository.Repositories
	redis       *redis.Client
	timerLock   sync.Mutex
	timerCancel context.CancelFunc
}

// NewAuctionService creates a new auction service
func NewAuctionService(repos *repository.Repositories, redis *redis.Client) *AuctionService {
	return &AuctionService{
		repos: repos,
		redis: redis,
	}
}

// withTimeout creates a context with timeout for database operations
// This prevents queries from hanging indefinitely
func (s *AuctionService) withTimeout(ctx context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithTimeout(ctx, timeout)
}

// GetState returns the current auction state
func (s *AuctionService) GetState(ctx context.Context) (*models.AuctionState, error) {
	// Add timeout to prevent hanging queries (critical for real-time auction state)
	queryCtx, cancel := s.withTimeout(ctx, 5*time.Second)
	defer cancel()

	auction, err := s.repos.Auctions.GetCurrent(queryCtx)
	if err != nil {
		// No active auction, return empty state
		return &models.AuctionState{
			Teams: []models.Team{},
		}, nil
	}

	state := &models.AuctionState{
		Auction: auction,
		Status:  auction.Status,
	}

	// Get current player if any
	if auction.CurrentPlayerID != nil {
		player, err := s.repos.Players.FindByID(queryCtx, *auction.CurrentPlayerID)
		if err == nil {
			state.CurrentPlayer = player
			
			// Set current_bid for frontend: use actual bid if exists, otherwise base_price
			if auction.CurrentBid != nil {
				state.CurrentBid = auction.CurrentBid
			} else {
				state.CurrentBid = &player.BasePrice
			}
		}
	}

	// Get current bidder if any
	if auction.CurrentBidderID != nil {
		team, err := s.repos.Teams.FindByID(queryCtx, *auction.CurrentBidderID)
		if err == nil {
			state.CurrentBidder = team
		}
	}

	// Get bid history for current player (only this player's bids)
	if auction.CurrentPlayerID != nil {
		bids, err := s.repos.Bids.FindByPlayer(queryCtx, *auction.CurrentPlayerID)
		if err == nil {
			state.BidHistory = bids
			
			// Check for tied teams at max bid (50000)
			if auction.CurrentBid != nil && *auction.CurrentBid == maxBid {
				// Find all unique teams that bid 50000
				teamIDs := make(map[uuid.UUID]bool)
				for _, bid := range bids {
					if bid.Amount == maxBid {
						teamIDs[bid.TeamID] = true
					}
				}
				// If more than 1 team bid 50000, it's a tie
				if len(teamIDs) > 1 {
					for teamID := range teamIDs {
						team, err := s.repos.Teams.FindByID(queryCtx, teamID)
						if err == nil && team != nil {
							state.TiedTeams = append(state.TiedTeams, *team)
						}
					}
				}
			}
		}
	}

	// Get all teams
	teams, err := s.repos.Teams.FindAll(queryCtx)
	if err == nil {
		state.Teams = teams
	}

	// Get next players in queue
	queue, err := s.repos.Players.GetQueue(queryCtx, 5)
	if err == nil {
		state.QueueNext = queue
	}

	// Check if timer is running (from Redis)
	timerRunning, _ := s.redis.Get(ctx, "auction:timer_running").Bool()
	state.TimerRunning = timerRunning

	// Check if bidding is frozen (1 second after last bid)
	freezeKey := "auction:bid_freeze"
	freeze, _ := s.redis.Get(ctx, freezeKey).Int64()
	now := time.Now().UnixMilli()
	state.BidFrozen = freeze > 0 && now-freeze < 1000

	return state, nil
}

// StartAuction starts or resumes an auction
func (s *AuctionService) StartAuction(ctx context.Context) (*models.Auction, error) {
	// Check if there's an existing auction
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		// Create new auction
		settings, _ := s.repos.Settings.GetAll(ctx)
		timerDuration := 30
		if td, ok := settings["timer_duration"].(float64); ok {
			timerDuration = int(td)
		}

		auction = &models.Auction{
			Name:          "Auction Session",
			Season:        "2026",
			Status:        "live",
			TimerDuration: timerDuration,
			Round:         1,
		}
		if err := s.repos.Auctions.Create(ctx, auction); err != nil {
			return nil, err
		}
	} else {
		// Resume existing auction
		auction.Status = "live"
		if err := s.repos.Auctions.UpdateStatus(ctx, auction.ID, "live"); err != nil {
			return nil, err
		}
	}

	return auction, nil
}

// PauseAuction pauses the auction
func (s *AuctionService) PauseAuction(ctx context.Context) error {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return errors.New("no active auction")
	}

	s.StopTimer()
	return s.repos.Auctions.UpdateStatus(ctx, auction.ID, "paused")
}

// ResumeAuction resumes a paused auction
func (s *AuctionService) ResumeAuction(ctx context.Context) error {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return errors.New("no active auction")
	}

	return s.repos.Auctions.UpdateStatus(ctx, auction.ID, "live")
}

// EndAuction ends the current auction
func (s *AuctionService) EndAuction(ctx context.Context) error {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return errors.New("no active auction")
	}

	s.StopTimer()
	return s.repos.Auctions.UpdateStatus(ctx, auction.ID, "completed")
}

// NextPlayer moves to the next player in queue
func (s *AuctionService) NextPlayer(ctx context.Context) (*models.Player, error) {
	// Add timeout for critical operation
	queryCtx, cancel := s.withTimeout(ctx, 10*time.Second)
	defer cancel()

	auction, err := s.repos.Auctions.GetCurrent(queryCtx)
	if err != nil {
		return nil, errors.New("no active auction")
	}

	// Get next player from queue
	queue, err := s.repos.Players.GetQueue(queryCtx, 1)
	if err != nil || len(queue) == 0 {
		return nil, errors.New("no more players in queue")
	}

	player := &queue[0]
	fullPlayer, err := s.repos.Players.FindByID(queryCtx, player.ID)
	if err != nil {
		return nil, err
	}

	// Set as current player
	if err := s.repos.Auctions.SetCurrentPlayer(queryCtx, auction.ID, player.ID, player.BasePrice); err != nil {
		return nil, err
	}

	// Reset timer in Redis
	s.redis.Set(ctx, "auction:timer_remaining", auction.TimerDuration, 0)
	s.redis.Set(ctx, "auction:timer_running", false, 0)

	return fullPlayer, nil
}

// StartBidForPlayer starts bidding for a specific player (manual selection by host)
func (s *AuctionService) StartBidForPlayer(ctx context.Context, playerID uuid.UUID) (*models.Player, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return nil, errors.New("no active auction")
	}

	// Get the player
	player, err := s.repos.Players.FindByID(ctx, playerID)
	if err != nil {
		return nil, errors.New("player not found")
	}

	// Validate player is available for auction
	if player.Status != "available" {
		return nil, errors.New("player is not available for auction")
	}

	// Set as current player
	if err := s.repos.Auctions.SetCurrentPlayer(ctx, auction.ID, player.ID, player.BasePrice); err != nil {
		return nil, err
	}

	// Reset timer in Redis
	s.redis.Set(ctx, "auction:timer_remaining", auction.TimerDuration, 0)
	s.redis.Set(ctx, "auction:timer_running", false, 0)

	return player, nil
}

// Bid ladder - the allowed bid amounts in order
var bidLadder = []int64{
	2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
	12000, 14000, 16000, 18000, 20000,
	24000, 28000, 32000, 36000, 40000, 45000, 50000,
}

const maxBid int64 = 50000

// getNextBidAmount returns the next valid bid amount given the current bid
func getNextBidAmount(currentBid int64) int64 {
	if currentBid == 0 {
		return bidLadder[0] // First bid is 2000
	}
	// Find the next bid in the ladder
	for _, amount := range bidLadder {
		if amount > currentBid {
			return amount
		}
	}
	// If current bid is at or above max, return max (for tie-bids at 50000)
	return maxBid
}

// isValidBidAmount checks if the amount is in the bid ladder
func isValidBidAmount(amount int64) bool {
	for _, validAmount := range bidLadder {
		if amount == validAmount {
			return true
		}
	}
	return false
}

// PlaceBid places a bid on the current player
func (s *AuctionService) PlaceBid(ctx context.Context, teamID uuid.UUID, amount int64) (*models.Bid, error) {
	// Add timeout for critical bid operation (10 seconds for write operations)
	queryCtx, cancel := s.withTimeout(ctx, 10*time.Second)
	defer cancel()

	auction, err := s.repos.Auctions.GetCurrent(queryCtx)
	if err != nil || auction.Status != "live" {
		return nil, errors.New("auction is not active")
	}

	if auction.CurrentPlayerID == nil {
		return nil, errors.New("no player currently on block")
	}

	// Check freeze time - prevent bids within 1 second of the last bid
	freezeKey := "auction:bid_freeze"
	freeze, _ := s.redis.Get(ctx, freezeKey).Int64()
	now := time.Now().UnixMilli()
	if freeze > 0 && now-freeze < 1000 {
		return nil, errors.New("please wait - bid in progress")
	}

	// Prevent same team from bidding consecutively - must wait for another team to bid
	if auction.CurrentBidderID != nil && *auction.CurrentBidderID == teamID {
		return nil, errors.New("you are already the leading bidder - wait for another team to bid")
	}

	// Validate bid is in the ladder
	if !isValidBidAmount(amount) {
		return nil, errors.New("invalid bid amount - must be from the bid ladder")
	}

	// Get team to validate budget
	team, err := s.repos.Teams.FindByID(queryCtx, teamID)
	if err != nil {
		return nil, errors.New("team not found")
	}

	remainingBudget := team.Budget - team.Spent
	if amount > remainingBudget {
		return nil, errors.New("insufficient budget")
	}

	// Validate bid is higher than current (except at max bid where ties are allowed)
	currentBid := auction.CurrentBid
	if currentBid != nil {
		if amount < *currentBid {
			return nil, errors.New("bid must be higher than current bid")
		}
		// Only allow same-amount bids at max (50000)
		if amount == *currentBid && amount != maxBid {
			return nil, errors.New("bid must be higher than current bid")
		}
	} else {
		// First bid: must be at least base price
		player, err := s.repos.Players.FindByID(queryCtx, *auction.CurrentPlayerID)
		if err != nil {
			return nil, err
		}
		if amount < player.BasePrice {
			return nil, errors.New("bid must be at least the base price")
		}
	}

	// Set freeze time BEFORE creating bid to prevent race conditions
	s.redis.Set(ctx, freezeKey, time.Now().UnixMilli(), 2*time.Second)

	// Create bid
	bid := &models.Bid{
		AuctionID: auction.ID,
		PlayerID:  *auction.CurrentPlayerID,
		TeamID:    teamID,
		Amount:    amount,
	}
	if err := s.repos.Bids.Create(queryCtx, bid); err != nil {
		return nil, err
	}

	// Update auction current bid
	if err := s.repos.Auctions.UpdateCurrentBid(queryCtx, auction.ID, amount, teamID); err != nil {
		return nil, err
	}

	// Reset timer
	s.redis.Set(ctx, "auction:timer_remaining", auction.TimerDuration, 0)

	// Add team info to bid
	bid.Team = team

	return bid, nil
}

// SellPlayer marks the current player as sold
func (s *AuctionService) SellPlayer(ctx context.Context) (*models.Player, *models.Team, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return nil, nil, errors.New("no active auction")
	}

	if auction.CurrentPlayerID == nil || auction.CurrentBidderID == nil || auction.CurrentBid == nil {
		return nil, nil, errors.New("no valid bid to sell")
	}

	s.StopTimer()

	// Mark player as sold
	if err := s.repos.Players.MarkSold(ctx, *auction.CurrentPlayerID, *auction.CurrentBidderID, *auction.CurrentBid); err != nil {
		return nil, nil, err
	}

	// Update team spent
	if err := s.repos.Teams.UpdateSpent(ctx, *auction.CurrentBidderID, *auction.CurrentBid); err != nil {
		return nil, nil, err
	}

	// Get sold player and team info
	player, _ := s.repos.Players.FindByID(ctx, *auction.CurrentPlayerID)
	team, _ := s.repos.Teams.FindByID(ctx, *auction.CurrentBidderID)

	// Clear current player from auction
	if err := s.repos.Auctions.ClearCurrentPlayer(ctx, auction.ID); err != nil {
		return nil, nil, err
	}

	return player, team, nil
}

// SellToTeam manually allocates the current player to a specific team (for tie-breaking at max bid)
func (s *AuctionService) SellToTeam(ctx context.Context, teamID uuid.UUID) (*models.Player, *models.Team, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return nil, nil, errors.New("no active auction")
	}

	if auction.CurrentPlayerID == nil || auction.CurrentBid == nil {
		return nil, nil, errors.New("no player currently on block")
	}

	// Verify the bid is at max (only allow manual allocation for ties at 50000)
	if *auction.CurrentBid != maxBid {
		return nil, nil, errors.New("manual allocation only allowed at max bid (tie-breaking)")
	}

	// Verify the team actually bid 50000 on this player
	bids, err := s.repos.Bids.FindByPlayer(ctx, *auction.CurrentPlayerID)
	if err != nil {
		return nil, nil, err
	}

	teamBid50000 := false
	for _, bid := range bids {
		if bid.TeamID == teamID && bid.Amount == maxBid {
			teamBid50000 = true
			break
		}
	}
	if !teamBid50000 {
		return nil, nil, errors.New("team did not bid 50000 on this player")
	}

	// Verify team has sufficient budget
	team, err := s.repos.Teams.FindByID(ctx, teamID)
	if err != nil {
		return nil, nil, errors.New("team not found")
	}
	remainingBudget := team.Budget - team.Spent
	if maxBid > remainingBudget {
		return nil, nil, errors.New("team has insufficient budget")
	}

	s.StopTimer()

	// Mark player as sold to the specified team
	if err := s.repos.Players.MarkSold(ctx, *auction.CurrentPlayerID, teamID, maxBid); err != nil {
		return nil, nil, err
	}

	// Update team spent
	if err := s.repos.Teams.UpdateSpent(ctx, teamID, maxBid); err != nil {
		return nil, nil, err
	}

	// Get sold player info
	player, _ := s.repos.Players.FindByID(ctx, *auction.CurrentPlayerID)

	// Clear current player from auction
	if err := s.repos.Auctions.ClearCurrentPlayer(ctx, auction.ID); err != nil {
		return nil, nil, err
	}

	return player, team, nil
}

// MarkUnsold marks the current player as unsold
func (s *AuctionService) MarkUnsold(ctx context.Context) (*models.Player, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return nil, errors.New("no active auction")
	}

	if auction.CurrentPlayerID == nil {
		return nil, errors.New("no player currently on block")
	}

	s.StopTimer()

	// Mark player as unsold
	if err := s.repos.Players.MarkUnsold(ctx, *auction.CurrentPlayerID); err != nil {
		return nil, err
	}

	player, _ := s.repos.Players.FindByID(ctx, *auction.CurrentPlayerID)

	// Clear current player
	if err := s.repos.Auctions.ClearCurrentPlayer(ctx, auction.ID); err != nil {
		return nil, err
	}

	return player, nil
}

// SkipPlayer skips the current player and returns them to the queue
func (s *AuctionService) SkipPlayer(ctx context.Context) (*models.Player, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return nil, errors.New("no active auction")
	}

	if auction.CurrentPlayerID == nil {
		return nil, errors.New("no player currently on block")
	}

	s.StopTimer()

	playerID := *auction.CurrentPlayerID

	// Delete any bids for this player (they don't count since we're skipping)
	// This is done by deleting bids for this player specifically
	s.repos.Bids.DeleteByPlayer(ctx, playerID)

	// Return player to queue (back to available status, moved to end of queue)
	if err := s.repos.Players.SkipPlayer(ctx, playerID); err != nil {
		return nil, err
	}

	player, _ := s.repos.Players.FindByID(ctx, playerID)

	// Clear current player
	if err := s.repos.Auctions.ClearCurrentPlayer(ctx, auction.ID); err != nil {
		return nil, err
	}

	return player, nil
}


// ResetTimer resets the bid timer
func (s *AuctionService) ResetTimer(ctx context.Context) (int, error) {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return 0, errors.New("no active auction")
	}

	s.redis.Set(ctx, "auction:timer_remaining", auction.TimerDuration, 0)
	return auction.TimerDuration, nil
}

// UndoBid removes the last bid for the current player
func (s *AuctionService) UndoBid(ctx context.Context) error {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		return errors.New("no active auction")
	}

	if auction.CurrentPlayerID == nil {
		return errors.New("no player currently on block")
	}

	playerID := *auction.CurrentPlayerID

	// Delete last bid for this player only
	if err := s.repos.Bids.DeleteLastBid(ctx, auction.ID, playerID); err != nil {
		return err
	}

	// Get new last bid for this player
	lastBid, err := s.repos.Bids.GetLastBid(ctx, auction.ID, playerID)
	if err != nil {
		// No more bids for this player, reset to base price
		player, _ := s.repos.Players.FindByID(ctx, playerID)
		if player != nil {
			auction.CurrentBid = &player.BasePrice
			auction.CurrentBidderID = nil
		}
	} else {
		auction.CurrentBid = &lastBid.Amount
		auction.CurrentBidderID = &lastBid.TeamID
	}

	return s.repos.Auctions.Update(ctx, auction)
}


// GetBidHistory returns bid history for a player
func (s *AuctionService) GetBidHistory(ctx context.Context, playerID uuid.UUID) ([]models.Bid, error) {
	return s.repos.Bids.FindByPlayer(ctx, playerID)
}

// StartTimer starts the countdown timer
func (s *AuctionService) StartTimer(ctx context.Context, onTick func(remaining int), onComplete func()) {
	s.timerLock.Lock()
	defer s.timerLock.Unlock()

	// Cancel existing timer
	if s.timerCancel != nil {
		s.timerCancel()
	}

	timerCtx, cancel := context.WithCancel(ctx)
	s.timerCancel = cancel
	s.redis.Set(ctx, "auction:timer_running", true, 0)

	go func() {
		// Panic recovery to prevent timer goroutine from crashing the server
		defer func() {
			if r := recover(); r != nil {
				log.Printf("CRITICAL: Timer goroutine panic recovered: %v", r)
				// Ensure timer state is set to stopped on panic
				s.redis.Set(context.Background(), "auction:timer_running", false, 0)
			}
		}()

		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-timerCtx.Done():
				return
			case <-ticker.C:
				// Panic recovery for each tick operation
				func() {
					defer func() {
						if r := recover(); r != nil {
							log.Printf("Error in timer tick operation: %v", r)
						}
					}()
					remaining, _ := s.redis.Get(context.Background(), "auction:timer_remaining").Int()
					if remaining <= 0 {
						s.redis.Set(context.Background(), "auction:timer_running", false, 0)
						if onComplete != nil {
							onComplete()
						}
						return
					}
					remaining--
					s.redis.Set(context.Background(), "auction:timer_remaining", remaining, 0)
					if onTick != nil {
						onTick(remaining)
					}
				}()
			}
		}
	}()
}

// StopTimer stops the countdown timer
func (s *AuctionService) StopTimer() {
	s.timerLock.Lock()
	defer s.timerLock.Unlock()

	if s.timerCancel != nil {
		s.timerCancel()
		s.timerCancel = nil
	}
	s.redis.Set(context.Background(), "auction:timer_running", false, 0)
}

// ResetAuction completely resets the auction - clears all bids, player statuses, team spent amounts
// Optimized with transaction for atomicity and performance
func (s *AuctionService) ResetAuction(ctx context.Context) error {
	// Stop any running timer first (non-blocking)
	s.StopTimer()

	// Use a transaction to ensure atomicity and improve performance
	tx, err := s.repos.GetDB().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Execute all reset operations in a single transaction
	// This reduces round trips and ensures atomicity
	
	// 1. Delete all bids (fastest operation, do first)
	if _, err := tx.Exec(ctx, "DELETE FROM bids"); err != nil {
		return err
	}

	// 2. Reset all players to available status (bulk update)
	if _, err := tx.Exec(ctx, `
		UPDATE players SET 
			status = 'available', 
			sold_price = NULL, 
			team_id = NULL, 
			sold_at = NULL, 
			badge = NULL, 
			updated_at = NOW()
	`); err != nil {
		return err
	}

	// 3. Reset all team spent amounts to 0 (bulk update)
	if _, err := tx.Exec(ctx, "UPDATE teams SET spent = 0, updated_at = NOW()"); err != nil {
		return err
	}

	// 4. Clear player references from auctions before deletion
	if _, err := tx.Exec(ctx, "UPDATE auctions SET current_player_id = NULL, current_bidder_id = NULL WHERE status IN ('live', 'paused', 'pending')"); err != nil {
		return err
	}

	// 5. Delete current auction records
	if _, err := tx.Exec(ctx, "DELETE FROM auctions WHERE status IN ('live', 'paused', 'pending')"); err != nil {
		return err
	}

	// Commit transaction - all operations succeed or all fail
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	// Clear Redis state (non-critical, don't fail if this fails)
	s.redis.Del(ctx, "auction:timer_remaining", "auction:timer_running", "auction:bid_freeze")

	return nil
}

// ResetEverything performs a complete reset - deletes all teams, players, bids, and auctions
// Optimized with transaction for atomicity and performance
func (s *AuctionService) ResetEverything(ctx context.Context) error {
	// Stop any running timer first (non-blocking)
	s.StopTimer()

	// Use a transaction to ensure atomicity and improve performance
	tx, err := s.repos.GetDB().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Execute all delete operations in a single transaction
	// Order matters due to foreign key constraints
	
	// 1. Delete all bids first (no dependencies)
	if _, err := tx.Exec(ctx, "DELETE FROM bids"); err != nil {
		return err
	}

	// 2. Clear ALL player references from ALL auctions (critical for FK constraints)
	if _, err := tx.Exec(ctx, "UPDATE auctions SET current_player_id = NULL, current_bidder_id = NULL"); err != nil {
		return err
	}

	// 3. Delete all players (safe now that references are cleared)
	if _, err := tx.Exec(ctx, "DELETE FROM players"); err != nil {
		return err
	}

	// 4. Delete all auctions (including completed ones)
	if _, err := tx.Exec(ctx, "DELETE FROM auctions"); err != nil {
		return err
	}

	// 5. Delete all teams (last, as players reference teams)
	if _, err := tx.Exec(ctx, "DELETE FROM teams"); err != nil {
		return err
	}

	// Commit transaction - all operations succeed or all fail
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	// Clear Redis state (non-critical, don't fail if this fails)
	s.redis.Del(ctx, "auction:timer_remaining", "auction:timer_running", "auction:bid_freeze")

	return nil
}

// SetLiveStatus sets the auction to live status (for broadcasting "Go Live")
func (s *AuctionService) SetLiveStatus(ctx context.Context) error {
	auction, err := s.repos.Auctions.GetCurrent(ctx)
	if err != nil {
		// Create new auction if none exists
		settings, _ := s.repos.Settings.GetAll(ctx)
		timerDuration := 30
		if td, ok := settings["timer_duration"].(float64); ok {
			timerDuration = int(td)
		}

		auction = &models.Auction{
			Name:          "Auction Session",
			Season:        "2026",
			Status:        "live",
			TimerDuration: timerDuration,
			Round:         1,
		}
		return s.repos.Auctions.Create(ctx, auction)
	}

	// Update existing auction to live status
	return s.repos.Auctions.UpdateStatus(ctx, auction.ID, "live")
}
