package repository

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/auctionapp/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlayerRepository handles player database operations
type PlayerRepository struct {
	db *pgxpool.Pool
}

// NewPlayerRepository creates a new player repository
func NewPlayerRepository(db *pgxpool.Pool) *PlayerRepository {
	return &PlayerRepository{db: db}
}

// FindAll returns players with filters
func (r *PlayerRepository) FindAll(ctx context.Context, filter models.PlayerFilter) ([]models.Player, int, error) {
	// Build dynamic query
	query := `
		SELECT p.id, p.name, p.country, p.country_flag, p.role, p.base_price, p.category,
			   p.image_url, p.stats, p.status, p.sold_price, p.team_id, p.sold_at,
			   p.queue_order, p.badge, p.created_at, p.updated_at,
			   t.id, t.name, t.short_name, t.color
		FROM players p
		LEFT JOIN teams t ON p.team_id = t.id
		WHERE 1=1
	`
	countQuery := "SELECT COUNT(*) FROM players p WHERE 1=1"
	args := []interface{}{}
	argCount := 0

	if filter.Status != "" {
		argCount++
		query += " AND p.status = $" + string(rune('0'+argCount))
		countQuery += " AND p.status = $" + string(rune('0'+argCount))
		args = append(args, filter.Status)
	}
	if filter.Role != "" {
		argCount++
		query += " AND p.role = $" + string(rune('0'+argCount))
		countQuery += " AND p.role = $" + string(rune('0'+argCount))
		args = append(args, filter.Role)
	}
	if filter.Category != "" {
		argCount++
		query += " AND p.category = $" + string(rune('0'+argCount))
		countQuery += " AND p.category = $" + string(rune('0'+argCount))
		args = append(args, filter.Category)
	}
	if filter.TeamID != "" {
		argCount++
		query += " AND p.team_id = $" + string(rune('0'+argCount))
		countQuery += " AND p.team_id = $" + string(rune('0'+argCount))
		args = append(args, filter.TeamID)
	}
	if filter.Search != "" {
		argCount++
		query += " AND LOWER(p.name) LIKE $" + string(rune('0'+argCount))
		countQuery += " AND LOWER(p.name) LIKE $" + string(rune('0'+argCount))
		args = append(args, "%"+strings.ToLower(filter.Search)+"%")
	}

	// Get total count
	var total int
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Add ordering and pagination
	query += " ORDER BY COALESCE(p.queue_order, 999999), p.created_at"
	if filter.Limit > 0 {
		argCount++
		query += " LIMIT $" + string(rune('0'+argCount))
		args = append(args, filter.Limit)
	}
	if filter.Offset > 0 {
		argCount++
		query += " OFFSET $" + string(rune('0'+argCount))
		args = append(args, filter.Offset)
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var statsJSON []byte
		var teamName, teamShort, teamColor *string
		var tID *uuid.UUID

		err := rows.Scan(
			&p.ID, &p.Name, &p.Country, &p.CountryFlag, &p.Role, &p.BasePrice, &p.Category,
			&p.ImageURL, &statsJSON, &p.Status, &p.SoldPrice, &p.TeamID, &p.SoldAt,
			&p.QueueOrder, &p.Badge, &p.CreatedAt, &p.UpdatedAt,
			&tID, &teamName, &teamShort, &teamColor,
		)
		if err != nil {
			return nil, 0, err
		}

		if len(statsJSON) > 0 {
			json.Unmarshal(statsJSON, &p.Stats)
		}

		if tID != nil {
			p.Team = &models.Team{
				ID:        *tID,
				Name:      *teamName,
				ShortName: *teamShort,
				Color:     *teamColor,
			}
		}

		players = append(players, p)
	}
	return players, total, nil
}

// FindByID finds a player by ID
func (r *PlayerRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Player, error) {
	p := &models.Player{}
	var statsJSON []byte
	var tID *uuid.UUID
	var teamName, teamShort, teamColor *string

	err := r.db.QueryRow(ctx, `
		SELECT p.id, p.name, p.country, p.country_flag, p.role, p.base_price, p.category,
			   p.image_url, p.stats, p.status, p.sold_price, p.team_id, p.sold_at,
			   p.queue_order, p.badge, p.created_at, p.updated_at,
			   t.id, t.name, t.short_name, t.color
		FROM players p
		LEFT JOIN teams t ON p.team_id = t.id
		WHERE p.id = $1
	`, id).Scan(
		&p.ID, &p.Name, &p.Country, &p.CountryFlag, &p.Role, &p.BasePrice, &p.Category,
		&p.ImageURL, &statsJSON, &p.Status, &p.SoldPrice, &p.TeamID, &p.SoldAt,
		&p.QueueOrder, &p.Badge, &p.CreatedAt, &p.UpdatedAt,
		&tID, &teamName, &teamShort, &teamColor,
	)
	if err != nil {
		return nil, err
	}

	if len(statsJSON) > 0 {
		json.Unmarshal(statsJSON, &p.Stats)
	}

	if tID != nil {
		p.Team = &models.Team{
			ID:        *tID,
			Name:      *teamName,
			ShortName: *teamShort,
			Color:     *teamColor,
		}
	}

	return p, nil
}

// FindByTeamID finds all players sold to a team
func (r *PlayerRepository) FindByTeamID(ctx context.Context, teamID uuid.UUID) ([]models.Player, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, country, country_flag, role, base_price, category,
			   image_url, stats, status, sold_price, team_id, sold_at,
			   queue_order, badge, created_at, updated_at
		FROM players 
		WHERE team_id = $1 AND (status = 'sold' OR status = 'retained')
		ORDER BY CASE WHEN status = 'retained' THEN 0 ELSE 1 END, sold_at DESC
	`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var statsJSON []byte
		err := rows.Scan(
			&p.ID, &p.Name, &p.Country, &p.CountryFlag, &p.Role, &p.BasePrice, &p.Category,
			&p.ImageURL, &statsJSON, &p.Status, &p.SoldPrice, &p.TeamID, &p.SoldAt,
			&p.QueueOrder, &p.Badge, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if len(statsJSON) > 0 {
			json.Unmarshal(statsJSON, &p.Stats)
		}
		players = append(players, p)
	}
	return players, nil
}

// GetQueue returns the next N players in queue
func (r *PlayerRepository) GetQueue(ctx context.Context, limit int) ([]models.Player, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, country, country_flag, role, base_price, category, queue_order
		FROM players 
		WHERE status = 'available'
		ORDER BY COALESCE(queue_order, 999999), created_at
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		err := rows.Scan(&p.ID, &p.Name, &p.Country, &p.CountryFlag, &p.Role, &p.BasePrice, &p.Category, &p.QueueOrder)
		if err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, nil
}

// Create creates a new player
func (r *PlayerRepository) Create(ctx context.Context, player *models.Player) error {
	statsJSON, _ := json.Marshal(player.Stats)
	return r.db.QueryRow(ctx, `
		INSERT INTO players (name, country, country_flag, role, base_price, category, stats, queue_order, image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, status, created_at, updated_at
	`, player.Name, player.Country, player.CountryFlag, player.Role, player.BasePrice,
		player.Category, statsJSON, player.QueueOrder, player.ImageURL).Scan(
		&player.ID, &player.Status, &player.CreatedAt, &player.UpdatedAt,
	)
}

// Update updates a player
func (r *PlayerRepository) Update(ctx context.Context, player *models.Player) error {
	statsJSON, _ := json.Marshal(player.Stats)
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			name = $2, country = $3, country_flag = $4, role = $5, base_price = $6,
			category = $7, image_url = $8, stats = $9, queue_order = $10, updated_at = NOW()
		WHERE id = $1
	`, player.ID, player.Name, player.Country, player.CountryFlag, player.Role, player.BasePrice,
		player.Category, player.ImageURL, statsJSON, player.QueueOrder)
	return err
}

// MarkSold marks a player as sold
func (r *PlayerRepository) MarkSold(ctx context.Context, playerID, teamID uuid.UUID, soldPrice int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'sold', sold_price = $2, team_id = $3, sold_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, playerID, soldPrice, teamID)
	return err
}

// MarkUnsold marks a player as unsold
func (r *PlayerRepository) MarkUnsold(ctx context.Context, playerID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE players SET status = 'unsold', updated_at = NOW() WHERE id = $1
	`, playerID)
	return err
}

// SkipPlayer returns a player back to the queue (still available, moved to end of queue)
func (r *PlayerRepository) SkipPlayer(ctx context.Context, playerID uuid.UUID) error {
	// Get the max queue_order and add 1 to put this player at the end
	var maxOrder int
	r.db.QueryRow(ctx, "SELECT COALESCE(MAX(queue_order), 0) FROM players WHERE status = 'available'").Scan(&maxOrder)
	
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'available', 
			queue_order = $2, 
			updated_at = NOW() 
		WHERE id = $1
	`, playerID, maxOrder+1)
	return err
}


// Delete deletes a player
func (r *PlayerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM players WHERE id = $1", id)
	return err
}

// CountByStatus counts players by status
func (r *PlayerRepository) CountByStatus(ctx context.Context, status string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM players WHERE status = $1", status).Scan(&count)
	return count, err
}

// Count returns total number of players
func (r *PlayerRepository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM players").Scan(&count)
	return count, err
}

// GetTotalSoldValue returns total value of sold players
func (r *PlayerRepository) GetTotalSoldValue(ctx context.Context) (int64, error) {
	var total int64
	err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(sold_price), 0) FROM players WHERE status = 'sold'").Scan(&total)
	return total, err
}

// GetTopBuys returns top N most expensive purchases
func (r *PlayerRepository) GetTopBuys(ctx context.Context, limit int) ([]models.Player, error) {
	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.name, p.role, p.sold_price, t.name, t.color
		FROM players p
		JOIN teams t ON p.team_id = t.id
		WHERE p.status = 'sold'
		ORDER BY p.sold_price DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var teamName, teamColor string
		err := rows.Scan(&p.ID, &p.Name, &p.Role, &p.SoldPrice, &teamName, &teamColor)
		if err != nil {
			return nil, err
		}
		p.Team = &models.Team{Name: teamName, Color: teamColor}
		players = append(players, p)
	}
	return players, nil
}

// GetRecentSales returns the most recent sales
func (r *PlayerRepository) GetRecentSales(ctx context.Context, limit int) ([]models.Player, error) {
	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.name, p.role, p.sold_price, p.sold_at, t.name, t.color
		FROM players p
		JOIN teams t ON p.team_id = t.id
		WHERE p.status = 'sold'
		ORDER BY p.sold_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var teamName, teamColor string
		err := rows.Scan(&p.ID, &p.Name, &p.Role, &p.SoldPrice, &p.SoldAt, &teamName, &teamColor)
		if err != nil {
			return nil, err
		}
		p.Team = &models.Team{Name: teamName, Color: teamColor}
		players = append(players, p)
	}
	return players, nil
}

// ResetAllPlayers resets all players to 'available' status, clears sold info
func (r *PlayerRepository) ResetAllPlayers(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'available', sold_price = NULL, team_id = NULL, sold_at = NULL, badge = NULL, updated_at = NOW()
	`)
	return err
}

// DeleteAll deletes all players from the database
func (r *PlayerRepository) DeleteAll(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "DELETE FROM players")
	return err
}

// RetainPlayer marks a player as retained by a team with an optional badge
func (r *PlayerRepository) RetainPlayer(ctx context.Context, playerID, teamID uuid.UUID, badge string) error {
	var badgePtr *string
	if badge != "" {
		badgePtr = &badge
	}
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'retained', team_id = $2, badge = $3, updated_at = NOW()
		WHERE id = $1
	`, playerID, teamID, badgePtr)
	return err
}

// ReleaseRetainedPlayer releases a retained player back to available pool
func (r *PlayerRepository) ReleaseRetainedPlayer(ctx context.Context, playerID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'available', team_id = NULL, badge = NULL, updated_at = NOW()
		WHERE id = $1 AND status = 'retained'
	`, playerID)
	return err
}

// ReleaseAllRetainedByTeam releases all retained players for a specific team
func (r *PlayerRepository) ReleaseAllRetainedByTeam(ctx context.Context, teamID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE players SET 
			status = 'available', team_id = NULL, badge = NULL, updated_at = NOW()
		WHERE team_id = $1 AND status = 'retained'
	`, teamID)
	return err
}

// GetRetainedByTeam returns all retained players for a team
func (r *PlayerRepository) GetRetainedByTeam(ctx context.Context, teamID uuid.UUID) ([]models.Player, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, country, country_flag, role, base_price, category,
			   image_url, stats, status, sold_price, team_id, sold_at,
			   queue_order, badge, created_at, updated_at
		FROM players 
		WHERE team_id = $1 AND status = 'retained'
		ORDER BY name
	`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var statsJSON []byte
		err := rows.Scan(
			&p.ID, &p.Name, &p.Country, &p.CountryFlag, &p.Role, &p.BasePrice, &p.Category,
			&p.ImageURL, &statsJSON, &p.Status, &p.SoldPrice, &p.TeamID, &p.SoldAt,
			&p.QueueOrder, &p.Badge, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if len(statsJSON) > 0 {
			json.Unmarshal(statsJSON, &p.Stats)
		}
		players = append(players, p)
	}
	return players, nil
}
