package repository

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, name, role, team_id, status, created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&user.TeamID, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, name, role, team_id, status, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&user.TeamID, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// FindAll returns all users with optional team info
func (r *UserRepository) FindAll(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.Query(ctx, `
		SELECT u.id, u.email, u.name, u.role, u.team_id, u.status, u.created_at, u.updated_at,
			   t.id, t.name, t.short_name, t.color
		FROM users u
		LEFT JOIN teams t ON u.team_id = t.id
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var teamName, teamShort, teamColor *string
		var tID *uuid.UUID
		
		err := rows.Scan(
			&u.ID, &u.Email, &u.Name, &u.Role, &u.TeamID, &u.Status, &u.CreatedAt, &u.UpdatedAt,
			&tID, &teamName, &teamShort, &teamColor,
		)
		if err != nil {
			return nil, err
		}
		
		if tID != nil {
			u.Team = &models.Team{
				ID:        *tID,
				Name:      *teamName,
				ShortName: *teamShort,
				Color:     *teamColor,
			}
		}
		
		users = append(users, u)
	}
	return users, nil
}

// Create creates a new user
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, name, role, team_id, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, user.Email, user.PasswordHash, user.Name, user.Role, user.TeamID, user.Status).Scan(
		&user.ID, &user.CreatedAt, &user.UpdatedAt,
	)
}

// Update updates a user
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET 
			email = $2, name = $3, role = $4, team_id = $5, status = $6, updated_at = NOW()
		WHERE id = $1
	`, user.ID, user.Email, user.Name, user.Role, user.TeamID, user.Status)
	return err
}

// UpdatePassword updates a user's password hash
func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET password_hash = $2, updated_at = NOW()
		WHERE id = $1
	`, id, passwordHash)
	return err
}

// Delete deletes a user
func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
	return err
}

// CountByRole counts users by role
func (r *UserRepository) CountByRole(ctx context.Context, role string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE role = $1", role).Scan(&count)
	return count, err
}
