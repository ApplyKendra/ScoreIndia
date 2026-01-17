---
description: Start all servers (backend and frontend)
---

# Start All Servers

This workflow starts both the NestJS backend and Next.js frontend servers.

## Steps

// turbo
1. Start the backend server (NestJS on port 3001):
```bash
cd /Users/sonuyadav/Desktop/Projects/IskconProject/backend && npm run start:dev
```

// turbo
2. Start the frontend server (Next.js on port 3000):
```bash
cd /Users/sonuyadav/Desktop/Projects/IskconProject/frontend && npm run dev
```

## Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## Notes
- Backend requires PostgreSQL to be running and configured in `.env`
- Both servers run in development mode with hot reload
