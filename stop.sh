#!/bin/bash

# AuctionApp Stop Script
# Stops all running servers

echo "🛑 Stopping AuctionApp..."

# Stop frontend (Next.js on port 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ Frontend stopped" || echo "   - Frontend not running"

# Stop backend (Go on port 3001)
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   ✓ Backend stopped" || echo "   - Backend not running"

# Stop Go processes
pkill -f "go run ./cmd/server" 2>/dev/null || true

# Optionally stop Docker containers
read -p "Stop Docker containers (postgres/redis)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down 2>/dev/null && echo "   ✓ Docker containers stopped" || true
fi

echo ""
echo "✅ All servers stopped!"
