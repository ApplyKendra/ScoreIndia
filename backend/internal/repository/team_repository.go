package repository

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TeamRepository handles team database operations
type TeamRepository struct {
	db *pgxpool.Pool
}

// NewTeamRepository creates a new team repository
func NewTeamRepository(db *pgxpool.Pool) *TeamRepository {
	return &TeamRepository{db: db}
}

// FindAll returns all teams with computed stats
func (r *TeamRepository) FindAll(ctx context.Context) ([]models.Team, error) {
	rows, err := r.db.Query(ctx, `
		SELECT t.id, t.name, t.short_name, t.color, t.logo_url, t.budget, t.spent,
			   t.max_players, t.max_foreign, t.created_at, t.updated_at,
			   COALESCE(COUNT(p.id), 0)::int as player_count,
			   COALESCE(SUM(CASE WHEN p.country NOT IN ('India', '🇮🇳') THEN 1 ELSE 0 END), 0)::int as foreign_count
		FROM teams t
		LEFT JOIN players p ON p.team_id = t.id AND p.status = 'sold'
		GROUP BY t.id
		ORDER BY t.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var t models.Team
		err := rows.Scan(
			&t.ID, &t.Name, &t.ShortName, &t.Color, &t.LogoURL, &t.Budget, &t.Spent,
			&t.MaxPlayers, &t.MaxForeign, &t.CreatedAt, &t.UpdatedAt,
			&t.PlayerCount, &t.ForeignCount,
		)
		if err != nil {
			return nil, err
		}
		t.RemainingBudget = t.Budget - t.Spent
		teams = append(teams, t)
	}
	return teams, nil
}

// FindByID finds a team by ID
func (r *TeamRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Team, error) {
	t := &models.Team{}
	err := r.db.QueryRow(ctx, `
		SELECT t.id, t.name, t.short_name, t.color, t.logo_url, t.budget, t.spent,
			   t.max_players, t.max_foreign, t.created_at, t.updated_at,
			   COALESCE(COUNT(p.id), 0)::int as player_count,
			   COALESCE(SUM(CASE WHEN p.country NOT IN ('India', '🇮🇳') THEN 1 ELSE 0 END), 0)::int as foreign_count
		FROM teams t
		LEFT JOIN players p ON p.team_id = t.id AND p.status = 'sold'
		WHERE t.id = $1
		GROUP BY t.id
	`, id).Scan(
		&t.ID, &t.Name, &t.ShortName, &t.Color, &t.LogoURL, &t.Budget, &t.Spent,
		&t.MaxPlayers, &t.MaxForeign, &t.CreatedAt, &t.UpdatedAt,
		&t.PlayerCount, &t.ForeignCount,
	)
	if err != nil {
		return nil, err
	}
	t.RemainingBudget = t.Budget - t.Spent
	return t, nil
}

// Create creates a new team
func (r *TeamRepository) Create(ctx context.Context, team *models.Team) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO teams (name, short_name, color, budget, max_players, max_foreign, logo_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, spent, created_at, updated_at
	`, team.Name, team.ShortName, team.Color, team.Budget, team.MaxPlayers, team.MaxForeign, team.LogoURL).Scan(
		&team.ID, &team.Spent, &team.CreatedAt, &team.UpdatedAt,
	)
}

// Update updates a team
func (r *TeamRepository) Update(ctx context.Context, team *models.Team) error {
	_, err := r.db.Exec(ctx, `
		UPDATE teams SET 
			name = $2, short_name = $3, color = $4, logo_url = $5, 
			budget = $6, max_players = $7, max_foreign = $8, updated_at = NOW()
		WHERE id = $1
	`, team.ID, team.Name, team.ShortName, team.Color, team.LogoURL,
		team.Budget, team.MaxPlayers, team.MaxForeign)
	return err
}

// UpdateSpent updates the spent amount for a team
func (r *TeamRepository) UpdateSpent(ctx context.Context, id uuid.UUID, amount int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE teams SET spent = spent + $2, updated_at = NOW() WHERE id = $1
	`, id, amount)
	return err
}

// Delete deletes a team
func (r *TeamRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM teams WHERE id = $1", id)
	return err
}

// Count returns total number of teams
func (r *TeamRepository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM teams").Scan(&count)
	return count, err
}

// ResetAllSpent resets spent amount to 0 for all teams
func (r *TeamRepository) ResetAllSpent(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "UPDATE teams SET spent = 0, updated_at = NOW()")
	return err
}

// DeleteAll deletes all teams from the database
func (r *TeamRepository) DeleteAll(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "DELETE FROM teams")
	return err
}

