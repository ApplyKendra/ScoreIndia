package services

import (
	"context"

	"github.com/auctionapp/backend/internal/models"
	"github.com/auctionapp/backend/internal/repository"
	"github.com/auctionapp/backend/internal/utils"
	"github.com/google/uuid"
)

// UserService handles user operations
type UserService struct {
	repos *repository.Repositories
}

// NewUserService creates a new user service
func NewUserService(repos *repository.Repositories) *UserService {
	return &UserService{repos: repos}
}

// GetAll returns all users
func (s *UserService) GetAll(ctx context.Context) ([]models.User, error) {
	return s.repos.Users.FindAll(ctx)
}

// GetByID returns a user by ID
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repos.Users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = ""
	return user, nil
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, req models.CreateUserRequest) (*models.User, error) {
	// Hash password
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: hash,
		Name:         req.Name,
		Role:         req.Role,
		Status:       "active",
	}

	if req.TeamID != "" {
		teamID, err := uuid.Parse(req.TeamID)
		if err == nil {
			user.TeamID = &teamID
		}
	}

	if err := s.repos.Users.Create(ctx, user); err != nil {
		return nil, err
	}
	user.PasswordHash = ""
	return user, nil
}

// Update updates a user
func (s *UserService) Update(ctx context.Context, id uuid.UUID, req models.UpdateUserRequest) (*models.User, error) {
	user, err := s.repos.Users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.Status != nil {
		user.Status = *req.Status
	}
	if req.TeamID != nil {
		if *req.TeamID == "" {
			user.TeamID = nil
		} else {
			teamID, err := uuid.Parse(*req.TeamID)
			if err == nil {
				user.TeamID = &teamID
			}
		}
	}

	if err := s.repos.Users.Update(ctx, user); err != nil {
		return nil, err
	}
	user.PasswordHash = ""
	return user, nil
}

// Delete deletes a user
func (s *UserService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repos.Users.Delete(ctx, id)
}
