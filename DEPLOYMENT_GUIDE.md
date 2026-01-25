# Complete Hostinger VPS Deployment Guide for AuctionApp

A comprehensive, step-by-step guide to deploy your AuctionApp on Hostinger VPS with production-grade security measures.

---

## Table of Contents

1. [Prerequisites & VPS Selection](#1-prerequisites--vps-selection)
2. [Initial VPS Setup & SSH Security](#2-initial-vps-setup--ssh-security)
3. [Firewall Configuration](#3-firewall-configuration)
4. [Install Required Software](#4-install-required-software)
5. [Domain & DNS Configuration](#5-domain--dns-configuration)
6. [Clone & Configure Application](#6-clone--configure-application)
7. [SSL/TLS Configuration with Let's Encrypt](#7-ssltls-configuration-with-lets-encrypt)
8. [Nginx Reverse Proxy Setup](#8-nginx-reverse-proxy-setup)
9. [Production Environment Variables](#9-production-environment-variables)
10. [Deploy the Application](#10-deploy-the-application)
11. [Process Management with PM2/Systemd](#11-process-management-with-pm2systemd)
12. [Database Backup Strategy](#12-database-backup-strategy)
13. [Monitoring & Logging](#13-monitoring--logging)
14. [Security Hardening Checklist](#14-security-hardening-checklist)
15. [Maintenance & Updates](#15-maintenance--updates)

---

## 1. Prerequisites & VPS Selection

### Recommended Hostinger VPS Plan
For production with ~1000 concurrent WebSocket connections:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| vCPU | 2 cores | 4 cores |
| Storage | 80 GB SSD | 100 GB SSD |
| Bandwidth | 4 TB | Unlimited |

> [!TIP]
> Select the **KVM 4** or **KVM 8** plan for best performance. Choose a data center closest to your target audience (Mumbai for India).

### Hostinger VPS Setup
1. Log into [Hostinger Panel](https://hpanel.hostinger.com/)
2. Go to **VPS** → **Create New VPS**
3. Choose **Ubuntu 22.04 LTS** as the OS
4. Select your preferred data center
5. Create a strong root password and save it securely

---

## 2. Initial VPS Setup & SSH Security

### Step 2.1: First SSH Connection

```bash
# Connect to your VPS (replace with your VPS IP)
ssh root@YOUR_VPS_IP
```

### Step 2.2: Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip htop nano fail2ban ufw
```

### Step 2.3: Create Non-Root User

> [!CAUTION]
> Never run production services as root.

```bash
# Create a new user (replace 'deploy' with your preferred username)
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

### Step 2.4: Configure SSH Key Authentication

**On your LOCAL machine:**

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to VPS
ssh-copy-id deploy@YOUR_VPS_IP
```

**On the VPS (as root):**

```bash
# Edit SSH config
nano /etc/ssh/sshd_config
```

Make these changes:

```diff
# Change default SSH port (optional but recommended)
- #Port 22
+ Port 2222

# Disable root login
- PermitRootLogin yes
+ PermitRootLogin no

# Disable password authentication
- #PasswordAuthentication yes
+ PasswordAuthentication no

# Enable key authentication
- #PubkeyAuthentication yes
+ PubkeyAuthentication yes

# Limit authentication attempts
+ MaxAuthTries 3

# Idle timeout
+ ClientAliveInterval 300
+ ClientAliveCountMax 2
```

```bash
# Restart SSH service
systemctl restart sshd
```

> [!WARNING]
> Before closing your current session, open a NEW terminal and test SSH connection with the new settings.

```bash
# Test from local machine
ssh -p 2222 deploy@YOUR_VPS_IP
```

---

## 3. Firewall Configuration

### Step 3.1: Configure UFW (Uncomplicated Firewall)

```bash
# Allow new SSH port
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Step 3.2: Configure Fail2Ban

```bash
# Create jail.local configuration
sudo nano /etc/fail2ban/jail.local
```

Add the following:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Check banned IPs
sudo fail2ban-client status sshd
```

---

## 4. Install Required Software

### Step 4.1: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker deploy

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Log out and back in for group changes to take effect
exit
ssh -p 2222 deploy@YOUR_VPS_IP

# Verify Docker
docker --version
```

### Step 4.2: Install Docker Compose

```bash
# Install Docker Compose v2
sudo apt install docker-compose-plugin -y

# Verify
docker compose version
```

### Step 4.3: Install Node.js (for npm commands)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version

# Install PM2 globally for process management
sudo npm install -g pm2
```

### Step 4.4: Install Go (for backend builds)

```bash
# Download and install Go 1.22
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
```

### Step 4.5: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 5. Domain & DNS Configuration

### Step 5.1: Point Domain to VPS

In your domain registrar (or Hostinger DNS panel):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

> [!NOTE]
> DNS propagation can take up to 48 hours, but usually completes within 1-2 hours.

### Step 5.2: Verify DNS

```bash
# Check if domain points to your VPS
dig +short yourdomain.com
ping yourdomain.com
```

---

## 6. Clone & Configure Application

### Step 6.1: Create Application Directory

```bash
# Create directory for the app
sudo mkdir -p /var/www/auctionapp
sudo chown -R deploy:deploy /var/www/auctionapp
cd /var/www/auctionapp
```

### Step 6.2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Or upload files via SCP from local machine:
# scp -P 2222 -r ./v2/* deploy@YOUR_VPS_IP:/var/www/auctionapp/
```

### Step 6.3: Set Correct Permissions

```bash
# Set ownership
sudo chown -R deploy:deploy /var/www/auctionapp

# Set directory permissions
find /var/www/auctionapp -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/auctionapp -type f -exec chmod 644 {} \;

# Make scripts executable
chmod +x /var/www/auctionapp/*.sh
```

---

## 7. SSL/TLS Configuration with Let's Encrypt

### Step 7.1: Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 7.2: Obtain SSL Certificate

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Certificate files will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Step 7.3: Auto-Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
```

Add this line:

```
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 8. Nginx Reverse Proxy Setup

### Step 8.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/auctionapp
```

Add the following production-optimized configuration:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Upstream definitions
upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Main HTTPS server for frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' wss://yourdomain.com https://api.yourdomain.com;" always;

    # Connection limits
    limit_conn conn_limit 20;
    limit_req zone=general_limit burst=50 nodelay;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Frontend proxy
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }
}

# API HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (same certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers for API
    add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Rate limiting for API
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;

    # API endpoints
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://yourdomain.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_connect_timeout 60s;
        
        # Disable buffering for WebSocket
        proxy_buffering off;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://backend;
        limit_req off;
    }
}

# Block common attack patterns
server {
    listen 443 ssl http2 default_server;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    return 444;
}
```

### Step 8.2: Enable Configuration

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Enable your config
sudo ln -s /etc/nginx/sites-available/auctionapp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 9. Production Environment Variables

### Step 9.1: Create Production .env File

```bash
cd /var/www/auctionapp
nano .env
```

> [!CAUTION]
> Never commit `.env` files to version control. Use secure methods to transfer secrets.

```bash
# ===========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ===========================================

# Environment
ENVIRONMENT=production

# Database - Use strong randomly generated password
# Generate with: openssl rand -base64 32
DB_PASSWORD=YOUR_SUPER_STRONG_DB_PASSWORD_HERE

# JWT Secret - Must be at least 32 characters
# Generate with: openssl rand -base64 64
JWT_SECRET=YOUR_SUPER_STRONG_JWT_SECRET_HERE_MINIMUM_64_CHARS
JWT_EXPIRY_MINUTES=15
REFRESH_EXPIRY_HOURS=168

# CORS - Your production domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# AWS S3 (for image uploads)
AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
S3_BUCKET=your-production-bucket
S3_REGION=ap-south-1

# Server
PORT=3001

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
```

### Step 9.2: Secure the .env File

```bash
# Restrict permissions
chmod 600 /var/www/auctionapp/.env
chown deploy:deploy /var/www/auctionapp/.env
```

### Step 9.3: Generate Secure Secrets

```bash
# Generate database password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

---

## 10. Deploy the Application

### Step 10.1: Update docker-compose.yml for Production

Create a production override file:

```bash
nano /var/www/auctionapp/docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access
    environment:
      - POSTGRES_USER=auction
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=auction
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U auction -d auction" ]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "127.0.0.1:6379:6379"  # Only localhost access
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  postgres_data:
  redis_data:
```

### Step 10.2: Start Database Services

```bash
cd /var/www/auctionapp

# Start databases only
docker compose -f docker-compose.prod.yml up -d

# Verify databases are running
docker compose -f docker-compose.prod.yml ps
```

### Step 10.3: Build and Deploy Backend

```bash
cd /var/www/auctionapp/backend

# Download dependencies
go mod download

# Build production binary
CGO_ENABLED=0 GOOS=linux go build -a -o auction-server ./cmd/server

# Set permissions
chmod +x auction-server
```

### Step 10.4: Build and Deploy Frontend

```bash
cd /var/www/auctionapp/frontend

# Install dependencies
npm install --legacy-peer-deps

# Build production bundle
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## 11. Process Management with PM2/Systemd

### Option A: Using PM2 (Recommended)

#### Step 11.1: Create PM2 Ecosystem File

```bash
nano /var/www/auctionapp/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'auction-backend',
      cwd: '/var/www/auctionapp/backend',
      script: './auction-server',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ENVIRONMENT: 'production',
        DATABASE_URL: `postgres://auction:${process.env.DB_PASSWORD}@localhost:5432/auction?sslmode=disable`,
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: process.env.JWT_SECRET,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
        AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
        S3_BUCKET: process.env.S3_BUCKET,
        S3_REGION: process.env.S3_REGION,
        PORT: 3001
      },
      error_file: '/var/www/auctionapp/logs/backend-error.log',
      out_file: '/var/www/auctionapp/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'auction-frontend',
      cwd: '/var/www/auctionapp/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.yourdomain.com/api',
        NEXT_PUBLIC_WS_URL: 'wss://api.yourdomain.com/ws',
        PORT: 3000
      },
      error_file: '/var/www/auctionapp/logs/frontend-error.log',
      out_file: '/var/www/auctionapp/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

#### Step 11.2: Create Logs Directory

```bash
mkdir -p /var/www/auctionapp/logs
```

#### Step 11.3: Start with PM2

```bash
cd /var/www/auctionapp

# Load environment variables and start
source .env && pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd

# Run the command it outputs (will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

#### Step 11.4: PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Restart specific app
pm2 restart auction-backend

# Monitor
pm2 monit

# Stop all
pm2 stop all
```

### Option B: Using Systemd

#### Backend Service

```bash
sudo nano /etc/systemd/system/auction-backend.service
```

```ini
[Unit]
Description=Auction Backend API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/auctionapp/backend
EnvironmentFile=/var/www/auctionapp/.env
Environment=DATABASE_URL=postgres://auction:${DB_PASSWORD}@localhost:5432/auction?sslmode=disable
Environment=REDIS_URL=redis://localhost:6379
ExecStart=/var/www/auctionapp/backend/auction-server
Restart=always
RestartSec=5
StandardOutput=append:/var/www/auctionapp/logs/backend.log
StandardError=append:/var/www/auctionapp/logs/backend-error.log

[Install]
WantedBy=multi-user.target
```

#### Frontend Service

```bash
sudo nano /etc/systemd/system/auction-frontend.service
```

```ini
[Unit]
Description=Auction Frontend Next.js Server
After=network.target auction-backend.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/auctionapp/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
StandardOutput=append:/var/www/auctionapp/logs/frontend.log
StandardError=append:/var/www/auctionapp/logs/frontend-error.log

[Install]
WantedBy=multi-user.target
```

#### Enable Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable auction-backend auction-frontend
sudo systemctl start auction-backend auction-frontend

# Check status
sudo systemctl status auction-backend
sudo systemctl status auction-frontend
```

---

## 12. Database Backup Strategy

### Step 12.1: Create Backup Script

```bash
nano /var/www/auctionapp/scripts/backup.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/www/auctionapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="auctionapp-postgres-1"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec $DB_CONTAINER pg_dump -U auction auction | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup created: db_backup_$DATE.sql.gz"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Remove old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "🗑️  Removed backups older than $RETENTION_DAYS days"

# Optional: Upload to S3
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/auctionapp/
```

```bash
chmod +x /var/www/auctionapp/scripts/backup.sh
mkdir -p /var/www/auctionapp/backups
```

### Step 12.2: Schedule Automatic Backups

```bash
crontab -e
```

Add:

```
# Daily backup at 2 AM
0 2 * * * /var/www/auctionapp/scripts/backup.sh >> /var/www/auctionapp/logs/backup.log 2>&1
```

### Step 12.3: Restore from Backup

```bash
# To restore a backup:
gunzip < /var/www/auctionapp/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i auctionapp-postgres-1 psql -U auction auction
```

---

## 13. Monitoring & Logging

### Step 13.1: Install Log Rotation

```bash
sudo nano /etc/logrotate.d/auctionapp
```

```
/var/www/auctionapp/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Step 13.2: System Monitoring Script

```bash
nano /var/www/auctionapp/scripts/health-check.sh
```

```bash
#!/bin/bash

# Health check endpoints
BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL)
if [ $BACKEND_STATUS -eq 200 ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is DOWN (HTTP $BACKEND_STATUS)"
    # Optional: Send alert
    # curl -X POST -H 'Content-type: application/json' --data '{"text":"⚠️ AuctionApp Backend is DOWN!"}' YOUR_SLACK_WEBHOOK_URL
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $FRONTEND_STATUS -eq 200 ]; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is DOWN (HTTP $FRONTEND_STATUS)"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️  Warning: Disk usage is at ${DISK_USAGE}%"
fi

# Check memory
FREE_MEM=$(free -m | awk 'NR==2 {printf "%.0f", $7/$2*100}')
if [ $FREE_MEM -lt 15 ]; then
    echo "⚠️  Warning: Low memory (${FREE_MEM}% free)"
fi

# Check Docker containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "postgres|redis"
```

```bash
chmod +x /var/www/auctionapp/scripts/health-check.sh
```

### Step 13.3: Schedule Health Checks

```bash
crontab -e
```

Add:

```
# Health check every 5 minutes
*/5 * * * * /var/www/auctionapp/scripts/health-check.sh >> /var/www/auctionapp/logs/health.log 2>&1
```

---

## 14. Security Hardening Checklist

### Essential Security Measures

| Category | Action | Status |
|----------|--------|--------|
| **SSH** | Change default port to 2222 | ☐ |
| **SSH** | Disable root login | ☐ |
| **SSH** | Use key-based authentication only | ☐ |
| **SSH** | Implement fail2ban | ☐ |
| **Firewall** | Enable UFW | ☐ |
| **Firewall** | Only allow ports 80, 443, 2222 | ☐ |
| **SSL** | Install Let's Encrypt certificates | ☐ |
| **SSL** | Enable HSTS header | ☐ |
| **SSL** | Use TLS 1.2/1.3 only | ☐ |
| **Nginx** | Add security headers | ☐ |
| **Nginx** | Enable rate limiting | ☐ |
| **Nginx** | Content Security Policy | ☐ |
| **Database** | Bind to localhost only | ☐ |
| **Database** | Use strong passwords | ☐ |
| **Redis** | Bind to localhost only | ☐ |
| **App** | Environment-specific secrets | ☐ |
| **App** | Secure .env file permissions | ☐ |
| **Backup** | Automated daily backups | ☐ |
| **Updates** | Enable unattended-upgrades | ☐ |

### Additional Security Steps

#### Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

#### Restrict Docker API

```bash
# Docker should not expose API externally - verified by default
sudo nano /etc/docker/daemon.json
```

```json
{
  "live-restore": true,
  "userland-proxy": false
}
```

```bash
sudo systemctl restart docker
```

#### Install Security Scanning

```bash
# Install ClamAV antivirus
sudo apt install clamav clamav-daemon -y
sudo freshclam
sudo systemctl start clamav-daemon
```

---

## 15. Maintenance & Updates

### Step 15.1: Update Application Script

```bash
nano /var/www/auctionapp/scripts/update.sh
```

```bash
#!/bin/bash
set -e

echo "🔄 Starting application update..."

cd /var/www/auctionapp

# Backup first
./scripts/backup.sh

# Pull latest code
git pull origin main

# Update backend
echo "📦 Building backend..."
cd backend
go mod download
CGO_ENABLED=0 GOOS=linux go build -a -o auction-server ./cmd/server
cd ..

# Update frontend
echo "🎨 Building frontend..."
cd frontend
npm install --legacy-peer-deps
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
cd ..

# Restart services
echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Update complete!"
```

```bash
chmod +x /var/www/auctionapp/scripts/update.sh
```

### Step 15.2: System Updates

```bash
# Weekly system updates
sudo apt update && sudo apt upgrade -y

# Docker cleanup (monthly)
docker system prune -af
```

---

## Quick Reference Commands

```bash
# View application logs
pm2 logs

# Restart all services
pm2 restart all

# Check service status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check database containers
docker compose -f docker-compose.prod.yml ps

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop

# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew SSL certificates
sudo certbot renew
```

---

## Troubleshooting

### Common Issues

#### 502 Bad Gateway
- Check if backend/frontend are running: `pm2 status`
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
- Verify ports are not blocked: `sudo netstat -tlnp`

#### WebSocket Connection Failed
- Ensure nginx has WebSocket upgrade headers
- Check `proxy_read_timeout` is set high enough
- Verify `wss://` protocol is used in production

#### Database Connection Failed
- Verify Docker container is running: `docker ps`
- Check container logs: `docker logs auctionapp-postgres-1`
- Verify DATABASE_URL is correct

#### SSL Certificate Issues
- Check certificate validity: `sudo certbot certificates`
- Test renewal: `sudo certbot renew --dry-run`
- Verify certificate files exist in `/etc/letsencrypt/live/`

---

> [!IMPORTANT]
> **Before going live:**
> 1. Replace all instances of `yourdomain.com` with your actual domain
> 2. Generate and set strong passwords for `DB_PASSWORD` and `JWT_SECRET`
> 3. Configure your actual AWS S3 credentials for image uploads
> 4. Test all functionality thoroughly
> 5. Complete the security checklist above

---

*Last updated: January 2026*
