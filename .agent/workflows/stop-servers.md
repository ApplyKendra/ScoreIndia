---
description: Stop all running servers
---

# Stop All Servers

This workflow stops both the backend and frontend development servers.

## Steps

// turbo
1. Find and kill all Node.js processes running on ports 3000 and 3001:
```bash
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || echo "No servers running on ports 3000/3001"
```

## Alternative Manual Method
If the above doesn't work, you can manually stop servers:

1. List processes on development ports:
```bash
lsof -i:3000 -i:3001
```

2. Kill specific process by PID:
```bash
kill -9 <PID>
```

## Notes
- This kills all processes on ports 3000 and 3001
- Safe to run even if no servers are running
