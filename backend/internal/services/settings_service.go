package services

import (
	"context"

	"github.com/auctionapp/backend/internal/repository"
)

// SettingsService handles settings operations
type SettingsService struct {
	repos *repository.Repositories
}

// NewSettingsService creates a new settings service
func NewSettingsService(repos *repository.Repositories) *SettingsService {
	return &SettingsService{repos: repos}
}

// GetAll returns all settings
func (s *SettingsService) GetAll(ctx context.Context) (map[string]interface{}, error) {
	return s.repos.Settings.GetAll(ctx)
}

// Update updates multiple settings
func (s *SettingsService) Update(ctx context.Context, settings map[string]interface{}) error {
	return s.repos.Settings.SetBulk(ctx, settings)
}

// Get returns a single setting
func (s *SettingsService) Get(ctx context.Context, key string) (interface{}, error) {
	return s.repos.Settings.Get(ctx, key)
}
