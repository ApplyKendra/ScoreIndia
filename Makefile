.PHONY: dev build run test clean docker-up docker-down

# Development
dev:
	cd backend && go run ./cmd/server

# Build backend
build:
	cd backend && go build -o bin/server ./cmd/server

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
watch:
	cd backend && air

# Run tests
test:
	cd backend && go test -v ./...

# Install dependencies
deps:
	cd backend && go mod tidy
	cd frontend && npm install

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

# Database
db-migrate:
	cd backend && go run ./cmd/migrate

db-seed:
	cd backend && go run ./cmd/seed

# Clean build artifacts
clean:
	rm -rf backend/bin
	rm -rf frontend/.next
	rm -rf frontend/node_modules/.cache

# Full setup for first run
setup:
	cp .env.example .env
	make deps
	make docker-up
	@echo "Waiting for services to start..."
	sleep 5
	@echo "Setup complete! Run 'make dev' to start the backend"

# Production build
prod-build:
	docker-compose -f docker-compose.prod.yml build

# Start everything for development
start:
	docker-compose up -d postgres redis
	@echo "Waiting for database..."
	sleep 3
	cd backend && go run ./cmd/server &
	cd frontend && npm run dev

# Stop all services
stop:
	docker-compose down
	-pkill -f "go run ./cmd/server" 2>/dev/null || true
