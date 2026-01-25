package services

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/google/uuid"
)

// TeamService handles team operations
type TeamService struct {
	repos *repository.Repositories
}

// NewTeamService creates a new team service
func NewTeamService(repos *repository.Repositories) *TeamService {
	return &TeamService{repos: repos}
}

// GetAll returns all teams
func (s *TeamService) GetAll(ctx context.Context) ([]models.Team, error) {
	return s.repos.Teams.FindAll(ctx)
}

// GetByID returns a team by ID
func (s *TeamService) GetByID(ctx context.Context, id uuid.UUID) (*models.Team, error) {
	return s.repos.Teams.FindByID(ctx, id)
}

// GetSquad returns all players for a team
func (s *TeamService) GetSquad(ctx context.Context, teamID uuid.UUID) ([]models.Player, error) {
	return s.repos.Players.FindByTeamID(ctx, teamID)
}

// Create creates a new team
func (s *TeamService) Create(ctx context.Context, req models.CreateTeamRequest) (*models.Team, error) {
	team := &models.Team{
		Name:       req.Name,
		ShortName:  req.ShortName,
		Color:      req.Color,
		Budget:     req.Budget,
		MaxPlayers: 25,
		MaxForeign: 8,
	}
	if req.MaxPlayers > 0 {
		team.MaxPlayers = req.MaxPlayers
	}
	if req.MaxForeign > 0 {
		team.MaxForeign = req.MaxForeign
	}
	if req.LogoURL != "" {
		team.LogoURL = &req.LogoURL
	}

	if err := s.repos.Teams.Create(ctx, team); err != nil {
		return nil, err
	}
	team.RemainingBudget = team.Budget
	return team, nil
}

// Update updates a team
func (s *TeamService) Update(ctx context.Context, id uuid.UUID, req models.UpdateTeamRequest) (*models.Team, error) {
	team, err := s.repos.Teams.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		team.Name = *req.Name
	}
	if req.ShortName != nil {
		team.ShortName = *req.ShortName
	}
	if req.Color != nil {
		team.Color = *req.Color
	}
	if req.LogoURL != nil {
		team.LogoURL = req.LogoURL
	}
	if req.Budget != nil {
		team.Budget = *req.Budget
	}
	if req.MaxPlayers != nil {
		team.MaxPlayers = *req.MaxPlayers
	}
	if req.MaxForeign != nil {
		team.MaxForeign = *req.MaxForeign
	}

	if err := s.repos.Teams.Update(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}

// Delete deletes a team
func (s *TeamService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repos.Teams.Delete(ctx, id)
}
