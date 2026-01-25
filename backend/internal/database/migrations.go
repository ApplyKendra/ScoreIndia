package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations runs database migrations
func RunMigrations(db *pgxpool.Pool) error {
	ctx := context.Background()

	// Run inline migration (simpler approach)

	initialMigration := `
	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'host', 'bidder', 'viewer')),
		team_id UUID,
		status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Teams table
	CREATE TABLE IF NOT EXISTS teams (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(255) NOT NULL,
		short_name VARCHAR(10) NOT NULL,
		color VARCHAR(7) NOT NULL,
		logo_url VARCHAR(500),
		budget BIGINT NOT NULL DEFAULT 150000,
		spent BIGINT NOT NULL DEFAULT 0,
		max_players INT DEFAULT 25,
		max_foreign INT DEFAULT 8,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Add foreign key constraint
	DO $$ BEGIN
		ALTER TABLE users ADD CONSTRAINT fk_users_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
	EXCEPTION
		WHEN duplicate_object THEN null;
	END $$;

	-- Players table
	CREATE TABLE IF NOT EXISTS players (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(255) NOT NULL,
		country VARCHAR(100) NOT NULL,
		country_flag VARCHAR(10),
		role VARCHAR(50) NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper')),
		base_price BIGINT NOT NULL,
		category VARCHAR(50) DEFAULT 'Set 1',
		image_url VARCHAR(500),
		stats JSONB DEFAULT '{}',
		status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'unsold', 'retained')),
		sold_price BIGINT,
		team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
		sold_at TIMESTAMP,
		queue_order INT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Auctions table
	CREATE TABLE IF NOT EXISTS auctions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(255) NOT NULL,
		season VARCHAR(50) NOT NULL,
		status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'paused', 'completed')),
		current_player_id UUID REFERENCES players(id),
		current_bid BIGINT,
		current_bidder_id UUID REFERENCES teams(id),
		timer_duration INT DEFAULT 30,
		timer_remaining INT,
		round INT DEFAULT 1,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Bids table
	CREATE TABLE IF NOT EXISTS bids (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
		player_id UUID REFERENCES players(id) ON DELETE CASCADE,
		team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
		amount BIGINT NOT NULL,
		bid_time TIMESTAMP DEFAULT NOW(),
		is_winning BOOLEAN DEFAULT FALSE
	);

	-- Settings table
	CREATE TABLE IF NOT EXISTS settings (
		key VARCHAR(100) PRIMARY KEY,
		value JSONB NOT NULL,
		updated_at TIMESTAMP DEFAULT NOW()
	);

	-- Indexes
	CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
	CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
	CREATE INDEX IF NOT EXISTS idx_players_queue_order ON players(queue_order);
	CREATE INDEX IF NOT EXISTS idx_bids_player_id ON bids(player_id);
	CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);

	-- Insert default settings
	INSERT INTO settings (key, value) VALUES
		('tournament_name', '"Premier Cricket League 2026"'),
		('season', '"2026"'),
		('currency', '"INR"'),
		('total_purse', '150000'),
		('min_squad_size', '18'),
		('max_squad_size', '25'),
		('timer_duration', '30'),
		('bid_increments', '[2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000, 24000, 28000, 32000, 36000, 40000, 45000, 50000]')
	ON CONFLICT (key) DO NOTHING;

	-- Insert default super admin (password: admin123)
	INSERT INTO users (email, password_hash, name, role, status) VALUES
		('admin@auction.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJq0RFHjYPRLMMSPCRZpE0Oy', 'Super Admin', 'super_admin', 'active')
	ON CONFLICT (email) DO NOTHING;
	`

	_, err := db.Exec(ctx, initialMigration)
	if err != nil {
		return fmt.Errorf("failed to run initial migration: %w", err)
	}

	fmt.Println("Applied initial database schema")
	return nil
}
