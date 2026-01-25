package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SettingsRepository handles settings database operations
type SettingsRepository struct {
	db *pgxpool.Pool
}

// NewSettingsRepository creates a new settings repository
func NewSettingsRepository(db *pgxpool.Pool) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// GetAll returns all settings as a map
func (r *SettingsRepository) GetAll(ctx context.Context) (map[string]interface{}, error) {
	rows, err := r.db.Query(ctx, "SELECT key, value FROM settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]interface{})
	for rows.Next() {
		var key string
		var valueJSON []byte
		if err := rows.Scan(&key, &valueJSON); err != nil {
			return nil, err
		}
		var value interface{}
		json.Unmarshal(valueJSON, &value)
		settings[key] = value
	}
	return settings, nil
}

// Get returns a single setting value
func (r *SettingsRepository) Get(ctx context.Context, key string) (interface{}, error) {
	var valueJSON []byte
	err := r.db.QueryRow(ctx, "SELECT value FROM settings WHERE key = $1", key).Scan(&valueJSON)
	if err != nil {
		return nil, err
	}
	var value interface{}
	json.Unmarshal(valueJSON, &value)
	return value, nil
}

// Set sets a setting value
func (r *SettingsRepository) Set(ctx context.Context, key string, value interface{}) error {
	valueJSON, err := json.Marshal(value)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(ctx, `
		INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
	`, key, valueJSON)
	return err
}

// SetBulk updates multiple settings at once
func (r *SettingsRepository) SetBulk(ctx context.Context, settings map[string]interface{}) error {
	for key, value := range settings {
		if err := r.Set(ctx, key, value); err != nil {
			return err
		}
	}
	return nil
}
