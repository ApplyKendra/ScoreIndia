# ISKCON Burla - Deployment Guide

## Overview

This guide walks you through deploying **iskconburla.com** using:
- **Frontend (Next.js)** → Vercel (Free tier)
- **Backend (NestJS)** → Render (Free tier)

---

## Prerequisites

Before starting, make sure you have:
- [x] GitHub account with the code pushed
- [x] Vercel account (https://vercel.com)
- [x] Render account (https://render.com)
- [x] Your database is set up (Neon PostgreSQL)
- [x] Your AWS account for S3/SES
- [x] Upstash Redis configured

---

## Step 1: Push Code to GitHub

If not already done:

```bash
cd /Users/sonuyadav/Desktop/Projects/IskconProject
git add .
git commit -m "Prepare for Vercel + Render deployment"
git push origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create New Web Service

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `iskconburla-api`
   - **Region**: `Singapore` (closest to India)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `node dist/main.js`
   - **Plan**: `Free`

### 2.2 Add Environment Variables

Click **"Environment"** tab and add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://iskconburla.com` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_lz29abevkBGA@ep-jolly-dust-a1oapkk6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `JWT_SECRET` | `your-super-secret-jwt-key-at-least-32-chars` |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key-at-least-32-chars` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `AWS_REGION` | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | `AKIA55E2JMVT2FDPPPDJ` |
| `AWS_SECRET_ACCESS_KEY` | `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` |
| `AWS_S3_BUCKET_NAME` | `iskcon-storage` |
| `AWS_SES_REGION` | `ap-south-1` |
| `TWO_FACTOR_ENCRYPTION_KEY` | `4bdc1152f15513d87d3c0e537b6b1239fa28d39a5247d93707a94b0a3d8ab29f` |
| `REDIS_URL` | `rediss://default:ASyFAAIncDI4YmUzYjUzZWIzNjU0NzZiODk1YzJiODkwNjYxMjk1ZnAyMTEzOTc@helped-minnow-11397.upstash.io:6379` |

### 2.3 Deploy

Click **"Create Web Service"** and wait for deployment.

Your API will be available at: `https://iskconburla-api.onrender.com`

> ⚠️ **Note**: Free tier has cold starts (~50 seconds after 15 min inactivity)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Project Name**: `iskconburla`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`

### 3.2 Add Environment Variables

In **"Environment Variables"** section, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://iskconburla-api.onrender.com/api` |

### 3.3 Deploy

Click **"Deploy"** and wait for build.

Your frontend will be available at: `https://iskconburla.vercel.app`

---

## Step 4: Connect Custom Domain (iskconburla.com)

### 4.1 Vercel (Frontend)

1. Go to your project → **"Settings"** → **"Domains"**
2. Add: `iskconburla.com` and `www.iskconburla.com`
3. Vercel will show DNS records to add

### 4.2 Add DNS Records

In your domain registrar (GoDaddy, Namecheap, etc.):

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

### 4.3 Update Backend CORS

After domain is connected, update Render environment variable:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://iskconburla.com` |

---

## Step 5: Run Database Migrations

In Render dashboard, go to your web service → **"Shell"** tab:

```bash
npx prisma migrate deploy
```

Or run locally with production DATABASE_URL:

```bash
cd backend
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

---

## Step 6: Verify Deployment

### Test Checklist

| Test | How to Verify |
|------|---------------|
| Homepage loads | Visit https://iskconburla.com |
| API responds | Visit https://iskconburla-api.onrender.com/api |
| User login | Try logging in with existing account |
| File uploads | Upload a hero slide image in admin |
| Cart/Orders | Add prasadam to cart and checkout |

---

## Troubleshooting

### Backend not starting

1. Check Render logs for errors
2. Verify all environment variables are set
3. Make sure DATABASE_URL is correct

### CORS errors in browser

1. Verify FRONTEND_URL in Render matches your domain
2. Check browser console for specific error

### Images not loading

1. Verify AWS_S3_BUCKET_NAME is correct
2. Check S3 bucket CORS settings

### Cold start issues (Render free tier)

- First request after 15 min takes ~50 seconds
- Consider upgrading to Starter plan ($7/month) for always-on

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel (Frontend) | Free | $0/month |
| Render (Backend) | Free | $0/month |
| Neon (Database) | Free | $0/month |
| Upstash (Redis) | Free | $0/month |
| AWS S3 | Pay-as-you-go | ~$0.50/month |
| AWS SES | Pay-as-you-go | ~$0.10/1000 emails |

**Total: ~$1/month** 🎉

---

## Quick Links

- **Frontend**: https://iskconburla.com
- **Backend API**: https://iskconburla-api.onrender.com/api
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
