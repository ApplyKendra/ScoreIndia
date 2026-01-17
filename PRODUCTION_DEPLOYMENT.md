# Production Deployment Guide

This guide covers setting up AWS SSM Parameter Store secrets and deploying the ISKCON Burla application to production.

## Prerequisites

1. AWS CLI installed and configured with appropriate credentials
2. Production database (PostgreSQL) URL ready
3. Redis URL (Upstash or similar) ready
4. AWS account with S3 bucket and SES configured

---

## Step 1: Create SSM Parameters

Run these commands to create all required secrets in AWS SSM Parameter Store:

```bash
# Set your AWS region
export AWS_REGION=ap-south-1

# Database URL (PostgreSQL)
aws ssm put-parameter \
  --name "/iskcon/database/url" \
  --value "postgresql://user:password@host:5432/database?sslmode=require" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

# JWT Access Token Secret (generate a strong random 64-char string)
aws ssm put-parameter \
  --name "/iskcon/jwt/secret" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

# JWT Refresh Token Secret (generate a different random 64-char string)
aws ssm put-parameter \
  --name "/iskcon/jwt/refresh-secret" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

# 2FA Encryption Key (32 bytes = 64 hex characters)
aws ssm put-parameter \
  --name "/iskcon/2fa/encryption-key" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

# AWS Credentials for S3/SES (create a dedicated IAM user for this)
aws ssm put-parameter \
  --name "/iskcon/aws/access-key-id" \
  --value "AKIAXXXXXXXXXXXXXXXXX" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/iskcon/aws/secret-access-key" \
  --value "your-secret-access-key-here" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION

# S3 Bucket Name
aws ssm put-parameter \
  --name "/iskcon/aws/s3/bucket-name" \
  --value "iskcon-storage" \
  --type "String" \
  --overwrite \
  --region $AWS_REGION

# SES Region (if different from main region)
aws ssm put-parameter \
  --name "/iskcon/aws/ses/region" \
  --value "ap-south-1" \
  --type "String" \
  --overwrite \
  --region $AWS_REGION

# Redis URL
aws ssm put-parameter \
  --name "/iskcon/redis/url" \
  --value "rediss://default:password@host:6379" \
  --type "SecureString" \
  --overwrite \
  --region $AWS_REGION
```

---

## Step 2: Verify Parameters

List all parameters to verify they were created:

```bash
aws ssm describe-parameters \
  --parameter-filters "Key=Name,Option=BeginsWith,Values=/iskcon/" \
  --region $AWS_REGION
```

---

## Step 3: IAM Role Permissions

Your EC2 instance or ECS task role needs these permissions. Create a policy and attach it:

```json
{
  "Version": "2012-10-17",
  "PolicyName": "IskconAppSSMAccess",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameters",
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:ap-south-1:*:parameter/iskcon/*"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:EncryptionContext:PARAMETER_ARN": "arn:aws:ssm:ap-south-1:*:parameter/iskcon/*"
        }
      }
    }
  ]
}
```

---

## Step 4: Production Environment Variables

In production, you only need these environment variables (non-secret):

```bash
# Production .env or environment config
NODE_ENV=production
PORT=3001
AWS_REGION=ap-south-1
FRONTEND_URL=https://iskconburla.org
```

All sensitive secrets are automatically loaded from SSM at application startup.

---

## Step 5: Build and Deploy

### Backend

```bash
cd backend

# Install dependencies
npm ci --production

# Build
npm run build

# Run database migrations
npx prisma migrate deploy

# Start production server
node dist/main.js
```

### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Start production server
npm start
```

---

## Step 6: Verify Deployment

1. Check backend logs for: `Loaded 9 secrets from AWS SSM`
2. Test authentication: Try logging in
3. Test file uploads: Upload a hero slide image
4. Test email: Trigger a password reset email
5. Test orders: Create a prasadam order

---

## Troubleshooting

### "Unable to load secrets from AWS SSM"
- Verify IAM role has SSM permissions
- Check parameter names match exactly (case-sensitive)
- Ensure instance is in the correct region

### "JWT_SECRET is required in production"
- Verify JWT secrets exist in SSM
- Check parameter paths: `/iskcon/jwt/secret` and `/iskcon/jwt/refresh-secret`

### "S3 uploads fail"
- Verify AWS credentials are correct in SSM
- Check S3 bucket exists and has correct CORS settings
- Verify IAM user has S3 write permissions

---

## Security Best Practices

1. **Rotate secrets regularly** - Update JWT secrets, API keys quarterly
2. **Limit IAM permissions** - Use least-privilege principle
3. **Monitor access** - Enable CloudTrail for SSM access logging
4. **Never commit secrets** - Keep `.env` out of version control
5. **Use separate IAM users** - Don't use root credentials

---

## Parameter Reference

| SSM Path | Description | Type |
|----------|-------------|------|
| `/iskcon/database/url` | PostgreSQL connection string | SecureString |
| `/iskcon/jwt/secret` | JWT access token secret | SecureString |
| `/iskcon/jwt/refresh-secret` | JWT refresh token secret | SecureString |
| `/iskcon/2fa/encryption-key` | TOTP encryption key (32 bytes hex) | SecureString |
| `/iskcon/aws/access-key-id` | AWS IAM access key ID | SecureString |
| `/iskcon/aws/secret-access-key` | AWS IAM secret access key | SecureString |
| `/iskcon/aws/s3/bucket-name` | S3 bucket name | String |
| `/iskcon/aws/ses/region` | AWS SES region | String |
| `/iskcon/redis/url` | Redis/Upstash connection URL | SecureString |
