# AWS SSM Parameter Store Setup Guide

This guide explains how to securely manage secrets for your AuctionApp production deployment using AWS SSM Parameter Store.

---

## Why Use SSM?

| Problem | Solution with SSM |
|---------|-------------------|
| `.env` files visible on VPS | Secrets stored encrypted in AWS, not on server |
| Database passwords in code/config | Fetched securely at runtime from SSM |
| Hard to rotate secrets | Update in AWS Console, no server changes needed |
| Multiple environments | Separate paths: `/auctionapp/production/`, `/auctionapp/staging/` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR VPS                                │
│                                                                 │
│  Only these env vars needed (minimal exposure):                 │
│  ┌─────────────────────────────────────────────┐                │
│  │ AWS_ACCESS_KEY_ID=AKIA...                   │                │
│  │ AWS_SECRET_ACCESS_KEY=xxx...                │◄─── Read-only  │
│  │ USE_AWS_SSM=true                            │     SSM access │
│  │ AWS_REGION=ap-south-1                       │                │
│  │ SSM_PARAMETER_PREFIX=/auctionapp/production │                │
│  └─────────────────────────────────────────────┘                │
│                          │                                      │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   Go Backend          │                          │
│              │   Fetches secrets     │─────────┐                │
│              │   from AWS SSM        │         │                │
│              └───────────────────────┘         │                │
└────────────────────────────────────────────────│────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────┐
                              │    AWS SSM Parameter Store       │
                              │    (Encrypted with AWS KMS)      │
                              │                                  │
                              │  /auctionapp/production/         │
                              │    ├── jwt-secret                │
                              │    ├── database-url              │
                              │    └── redis-url                 │
                              └──────────────────────────────────┘
```

---

## Step 1: Create IAM User for SSM Access

### 1.1 Create the User

1. Go to **AWS Console** → **IAM** → **Users** → **Create User**
2. User name: `auctionapp-ssm-reader`
3. Do NOT enable console access

### 1.2 Attach Inline Policy

Create a custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadSSMParameters",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:ap-south-1:*:parameter/auctionapp/production/*"
    }
  ]
}
```

### 1.3 Create Access Keys

1. Go to the user → **Security credentials** tab
2. Click **Create access key**
3. Select **Application running outside AWS**
4. Download and securely store the credentials

> ⚠️ **Security Note**: Even if these keys are compromised, the attacker can ONLY read your SSM parameters - nothing else in your AWS account.

---

## Step 2: Add Secrets to SSM Parameter Store

Run these commands from your **local machine** (not VPS) using AWS CLI:

### 2.1 Install and Configure AWS CLI

```bash
# Install AWS CLI (macOS)
brew install awscli

# Configure with your ADMIN credentials (not the ssm-reader)
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-south-1), Output format (json)
```

### 2.2 Create Parameters

```bash
# JWT Secret (use a strong random string)
aws ssm put-parameter \
  --name "/auctionapp/production/jwt-secret" \
  --value "your-super-secret-jwt-key-at-least-64-characters-long-random-string" \
  --type "SecureString" \
  --region ap-south-1

# Database URL (includes password)
aws ssm put-parameter \
  --name "/auctionapp/production/database-url" \
  --value "postgres://auction:YOUR_DB_PASSWORD@localhost:5432/auction?sslmode=disable" \
  --type "SecureString" \
  --region ap-south-1

# Redis URL
aws ssm put-parameter \
  --name "/auctionapp/production/redis-url" \
  --value "redis://localhost:6379" \
  --type "SecureString" \
  --region ap-south-1
```

### 2.3 Verify Parameters

```bash
# List all parameters (won't show values)
aws ssm describe-parameters \
  --filters "Key=Name,Values=/auctionapp/production/" \
  --region ap-south-1

# Get a specific parameter value (for testing)
aws ssm get-parameter \
  --name "/auctionapp/production/jwt-secret" \
  --with-decryption \
  --region ap-south-1
```

---

## Step 3: Configure VPS

### Option A: Using systemd (Recommended)

Create or edit the systemd service file:

```bash
sudo nano /etc/systemd/system/auctionapp-backend.service
```

```ini
[Unit]
Description=AuctionApp Backend Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/auctionapp/backend
ExecStart=/var/www/auctionapp/backend/server

# AWS SSM Configuration (NO secrets here!)
Environment="USE_AWS_SSM=true"
Environment="AWS_REGION=ap-south-1"
Environment="SSM_PARAMETER_PREFIX=/auctionapp/production"
Environment="AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXXX"
Environment="AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Non-secret configuration
Environment="PORT=3001"
Environment="ALLOWED_ORIGINS=https://yourdomain.com"

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Secure and start the service:

```bash
# Only root can read the service file
sudo chmod 600 /etc/systemd/system/auctionapp-backend.service

# Reload systemd
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable auctionapp-backend
sudo systemctl start auctionapp-backend

# Check status
sudo systemctl status auctionapp-backend
```

### Option B: Using Environment File (Alternative)

Create a secure environment file:

```bash
# Create file with restricted permissions
sudo touch /etc/auctionapp/backend.env
sudo chmod 600 /etc/auctionapp/backend.env
sudo chown root:root /etc/auctionapp/backend.env

# Edit the file
sudo nano /etc/auctionapp/backend.env
```

Content of `/etc/auctionapp/backend.env`:
```bash
USE_AWS_SSM=true
AWS_REGION=ap-south-1
SSM_PARAMETER_PREFIX=/auctionapp/production
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3001
ALLOWED_ORIGINS=https://yourdomain.com
```

Reference in systemd:
```ini
[Service]
EnvironmentFile=/etc/auctionapp/backend.env
```

---

## Step 4: Update Secrets (When Needed)

To update a secret, run from your local machine:

```bash
aws ssm put-parameter \
  --name "/auctionapp/production/jwt-secret" \
  --value "new-secret-value-here" \
  --type "SecureString" \
  --overwrite \
  --region ap-south-1
```

Then restart your backend on VPS:
```bash
sudo systemctl restart auctionapp-backend
```

---

## Troubleshooting

### Check if SSM is working

Look at the backend logs:
```bash
sudo journalctl -u auctionapp-backend -f
```

You should see:
```
CONFIG: Using AWS SSM Parameter Store for secrets
SSM: Initialized successfully (region: ap-south-1, prefix: /auctionapp/production)
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `SSM: Failed to load AWS config` | Check AWS credentials are correct |
| `failed to get SSM parameter` | Check parameter name and IAM permissions |
| `CONFIG: AWS SSM enabled but client unavailable` | AWS credentials not set or invalid |

### Test SSM Access from VPS

```bash
# Install AWS CLI on VPS
sudo apt install awscli

# Configure with ssm-reader credentials
aws configure

# Test access
aws ssm get-parameter \
  --name "/auctionapp/production/jwt-secret" \
  --with-decryption \
  --region ap-south-1
```

---

## Supported SSM Parameters

| SSM Parameter Key | Fallback Env Var | Description |
|-------------------|------------------|-------------|
| `jwt-secret` | `JWT_SECRET` | JWT signing key |
| `database-url` | `DATABASE_URL` | PostgreSQL connection string |
| `redis-url` | `REDIS_URL` | Redis connection string |

---

## Security Checklist

- [ ] Created IAM user with minimal SSM read-only permissions
- [ ] Access keys stored securely (not in git, not in .env files)
- [ ] systemd service file has `chmod 600`
- [ ] All secrets in SSM use `SecureString` type
- [ ] Tested fallback works if SSM is unavailable
- [ ] Backend logs show "Using AWS SSM Parameter Store for secrets"
