#!/bin/bash

# AuctionApp Start Script
# Starts PostgreSQL, Redis, Backend, and Frontend

echo "🚀 Starting AuctionApp..."

cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Starting without database."
    echo "   Please start Docker Desktop and run this script again for full functionality."
else
    echo "📦 Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis 2>/dev/null || true
    sleep 3
fi

# Start backend
echo "🔧 Starting Backend on port 3001..."
cd backend
go run ./cmd/server &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start frontend
echo "🎨 Starting Frontend on port 3000..."
cd frontend
# Increase memory limit to 12GB for development (Turbopack can be memory-intensive)
NODE_OPTIONS="--max-old-space-size=12288" npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ AuctionApp is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for any process to exit
wait
