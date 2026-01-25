#!/bin/bash

# AuctionApp Deployment Script for VPS (16GB RAM Optimized)
# Uses production builds for maximum stability and performance

set -e # Exit on error

echo "🚀 Starting Robust Deployment..."

# 1. Check and Start Databases
echo "📦 Checking Databases..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker."
    exit 1
fi

docker-compose up -d postgres redis
echo "✅ Databases are running."

# 2. Build and Start Backend
echo "🔧 Building Backend..."
cd backend
go mod download
if go build -o auction-server ./cmd/server; then
    echo "✅ Backend binary built successfully."
else
    echo "❌ Backend build failed."
    exit 1
fi

echo "🚀 Starting Backend..."
# Kill existing if running
pkill -f "./auction-server" || true
# Run in background with nohup
nohup ./auction-server > backend.log 2>&1 &
echo "✅ Backend running on port 3001"
cd ..

# 3. Build and Start Frontend
echo "🎨 Building Frontend..."
cd frontend
npm install --legacy-peer-deps

echo "   Compiling Next.js app (this may take a minute)..."
# Increase memory for the build process specifically
export NODE_OPTIONS="--max-old-space-size=8192"

if npm run build; then
    echo "✅ Frontend build successful."
else
    echo "❌ Frontend build failed."
    exit 1
fi

echo "🚀 Starting Frontend..."
# Kill existing specific node process if you can identify it, or let user manage it.
# For now, we'll try to stop previous instances on port 3000 if needed, usually users handle this.
# npm start runs 'next start'
# We allocate 8GB heap for the running server (plenty for 16GB VPS)
nohup npm start -- -p 3000 > frontend.log 2>&1 &
echo "✅ Frontend running on port 3000"
cd ..

echo ""
echo "🎉 Deployment Complete!"
echo "------------------------------------------------"
echo "   Backend Logs:  backend/backend.log"
echo "   Frontend Logs: frontend/frontend.log"
echo "------------------------------------------------"
echo "💡 To stop the servers, find their PIDs using 'ps aux | grep auction' or use 'pkill'"
