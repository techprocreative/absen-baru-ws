# FaceSenseAttend Deployment Guide

This guide will walk you through deploying FaceSenseAttend to Render (free tier) with Supabase as the database backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Render Deployment](#render-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Migration](#database-migration)
6. [Cron Job Setup](#cron-job-setup)
7. [Testing Your Deployment](#testing-your-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- A GitHub account with your FaceSenseAttend repository
- A [Supabase](https://supabase.com) account (free tier)
- A [Render](https://render.com) account (free tier)
- A [cron-job.org](https://cron-job.org) account (free tier) for keep-alive pings

---

## Supabase Setup

### 1. Create a Supabase Project

Your Supabase project has already been created with the following credentials:

**Supabase URL:**
```
https://oqsezgdlxahrgvxutbyb.supabase.co
```

**Anon Key (Public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xc2V6Z2RseGFocmd2eHV0YnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODMyNzksImV4cCI6MjA3ODc1OTI3OX0.b2yIbXvECWEvcaRySiZNWLT0vDb3A_2HbrUsPNqPljQ
```

**Service Role Key (Secret - Keep Private):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xc2V6Z2RseGFocmd2eHV0YnliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE4MzI3OSwiZXhwIjoyMDc4NzU5Mjc5fQ.YLB87rcEItNzu0FykIo2aPIkkIxQxZsAAAhI0XH-mCs
```

### 2. Get Database Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Database**
3. Scroll down to **Connection String** section
4. Select **URI** tab (not Session pooling)
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.oqsezgdlxahrgvxutbyb.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password (shown once during project creation)

**Important:** Keep this connection string secure - you'll need it for Render deployment.

### 3. Enable Required Extensions (Optional)

If your app requires PostgreSQL extensions:

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Search for and enable:
   - `uuid-ossp` (for UUID generation)
   - `pgcrypto` (for encryption functions)

---

## Render Deployment

### Option 1: Deploy Using Blueprint (Recommended)

This method uses the included [`render.yaml`](../render.yaml) file for automated setup.

1. **Connect Your Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New** → **Blueprint**
   - Connect your GitHub account if not already connected
   - Select your FaceSenseAttend repository
   - Render will automatically detect the `render.yaml` file

2. **Review Blueprint Configuration**
   - Service name: `facesenseattend`
   - Region: Singapore (closest to Asia/Jakarta timezone)
   - Plan: Free
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **Configure Environment Variables**
   
   Render will prompt you to set the `DATABASE_URL`. Use your Supabase connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.oqsezgdlxahrgvxutbyb.supabase.co:5432/postgres
   ```
   
   Other variables will be auto-generated or use default values from the blueprint.

4. **Deploy**
   - Click **Apply** to create the service
   - Render will build and deploy your application
   - Wait for the deployment to complete (usually 5-10 minutes)

### Option 2: Manual Deployment

If you prefer manual setup:

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Configure the following:

   | Setting | Value |
   |---------|-------|
   | Name | facesenseattend |
   | Region | Singapore |
   | Branch | main (or your default branch) |
   | Runtime | Node |
   | Build Command | `npm install && npm run build` |
   | Start Command | `npm start` |
   | Plan | Free |

2. **Set Environment Variables**
   
   Add the following environment variables in the Render dashboard:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | |
   | `PORT` | `5000` | Render uses PORT internally |
   | `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.oqsezgdlxahrgvxutbyb.supabase.co:5432/postgres` | Use your Supabase connection string |
   | `SESSION_SECRET` | Generate 64-char random string | Use: `openssl rand -base64 64` |
   | `JWT_SECRET` | Generate 64-char random string | Use: `openssl rand -base64 64` |
   | `ENCRYPTION_KEY` | Generate 32-char random string | Use: `openssl rand -base64 32` |
   | `LOG_LEVEL` | `info` | |
   | `LOG_DIR` | `/tmp/logs` | Render's writable directory |
   | `ALLOWED_ORIGINS` | `https://facesenseattend.onrender.com` | Update with your actual URL |

3. **Create Service**
   - Click **Create Web Service**
   - Wait for initial deployment to complete

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string from Supabase | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `SESSION_SECRET` | Secret key for session encryption | 64-character random string |
| `JWT_SECRET` | Secret key for JWT tokens | 64-character random string |
| `ENCRYPTION_KEY` | Key for data encryption | 32-character random string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port | `5000` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `LOG_DIR` | Directory for log files | `/tmp/logs` |
| `ALLOWED_ORIGINS` | CORS allowed origins | Your Render URL |

### Generating Secure Secrets

Use these commands to generate secure random strings:

```bash
# For SESSION_SECRET and JWT_SECRET (64 characters)
openssl rand -base64 64

# For ENCRYPTION_KEY (32 characters)
openssl rand -base64 32
```

---

## Database Migration

After your Render service is deployed, you need to run database migrations to set up the schema.

### Method 1: Using Render Shell (Recommended)

1. Go to your Render service dashboard
2. Click on **Shell** tab (or **Connect**)
3. Wait for the shell to connect
4. Run the migration command:
   ```bash
   npm run db:push
   ```
5. Verify the migration completed successfully

### Method 2: Local Migration with Remote Database

If you have the project locally:

1. Create a `.env` file with your Supabase `DATABASE_URL`
2. Run the migration:
   ```bash
   npm run db:push
   ```

### Migration Files

The application includes the following migrations in the [`migrations/`](../migrations/) directory:

- `0000_volatile_juggernaut.sql` - Initial schema
- `0001_add_guest_support.sql` - Guest user support
- `0002_add_indexes.sql` - Performance indexes

These will be automatically applied by the `db:push` command.

### Verify Database Setup

To verify your database is set up correctly:

1. Log into your Supabase dashboard
2. Go to **Table Editor**
3. You should see tables like:
   - `users`
   - `employees`
   - `attendance_records`
   - `guests`
   - `guest_check_ins`

---

## Cron Job Setup

Render's free tier services sleep after 15 minutes of inactivity. To keep your app awake, set up a cron job to ping it regularly.

### Using cron-job.org (Recommended)

1. **Create Account**
   - Go to [cron-job.org](https://cron-job.org)
   - Sign up for a free account

2. **Create New Cron Job**
   - Click **Cronjobs** → **Create Cronjob**
   - Use the configuration from [`cron-job.json`](../cron-job.json):

   | Setting | Value |
   |---------|-------|
   | Title | FaceSenseAttend Keep-Alive Ping |
   | Address/URL | `https://facesenseattend.onrender.com/api/ping` |
   | Schedule | Every 10 minutes (`*/10 * * * *`) |
   | Timezone | Asia/Jakarta (GMT+7) |
   | Notifications | On Failure only |

3. **Enable the Job**
   - Save and enable the cron job
   - Monitor the execution history to ensure it's working

### Alternative: Using GitHub Actions

Add this workflow file to `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Service Alive

on:
  schedule:
    # Run every 10 minutes
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Service
        run: |
          curl -f https://facesenseattend.onrender.com/api/ping || exit 1
```

**Note:** GitHub Actions may have reliability issues with scheduled workflows on free plans. cron-job.org is more reliable.

---

## Testing Your Deployment

### 1. Check Health Endpoint

Visit your health check endpoint to verify the service is running:

```
https://facesenseattend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T08:30:00.000Z",
  "database": "connected"
}
```

### 2. Test Application Access

1. Open your deployed application:
   ```
   https://facesenseattend.onrender.com
   ```

2. You should see the login page

3. Try logging in with default credentials (if seeded) or create a new account

### 3. Test Database Connection

1. Try registering a new employee
2. Verify the data appears in Supabase Table Editor
3. Test attendance recording functionality

### 4. Monitor Logs

In Render dashboard:
1. Go to your service
2. Click **Logs** tab
3. Look for any errors or warnings
4. Verify application started successfully

---

## Troubleshooting

### Service Won't Start

**Problem:** Service fails to start or crashes immediately

**Solutions:**
1. Check logs in Render dashboard for error messages
2. Verify `DATABASE_URL` is correctly formatted
3. Ensure all required environment variables are set
4. Check that migrations ran successfully
5. Verify Node.js version compatibility (check `package.json` engines field)

### Database Connection Errors

**Problem:** "Connection refused" or "Unable to connect to database"

**Solutions:**
1. Verify Supabase connection string format:
   ```
   postgresql://postgres:[PASSWORD]@db.oqsezgdlxahrgvxutbyb.supabase.co:5432/postgres
   ```
2. Check password doesn't contain special characters that need URL encoding
3. Verify Supabase project is active (not paused)
4. Test connection string locally:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.oqsezgdlxahrgvxutbyb.supabase.co:5432/postgres"
   ```

### Build Failures

**Problem:** Build fails during deployment

**Solutions:**
1. Check for syntax errors in code
2. Verify all dependencies are in `package.json`
3. Check Node.js version compatibility
4. Review build logs for specific error messages
5. Try building locally: `npm run build`

### Application Errors (500)

**Problem:** Application loads but returns 500 errors

**Solutions:**
1. Check Render logs for stack traces
2. Verify environment variables are set correctly
3. Check database migrations completed successfully
4. Verify file permissions for uploads/logs (`/tmp` directory)
5. Test with `LOG_LEVEL=debug` for more detailed logging

### CORS Errors

**Problem:** Frontend can't connect to backend (CORS errors)

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your Render URL
2. Check that URL doesn't have trailing slash
3. Update CORS configuration in [`server/middleware/security.ts`](../server/middleware/security.ts)

### Free Tier Sleep Issues

**Problem:** Service sleeps and is slow to wake up

**Solutions:**
1. Verify cron job is running (check cron-job.org dashboard)
2. Ensure ping interval is 10 minutes or less
3. Consider upgrading to paid plan for always-on service
4. Check cron job URL is correct (with `/api/ping` endpoint)

### Migration Errors

**Problem:** Database migrations fail

**Solutions:**
1. Run migrations manually using Render shell
2. Check Supabase database is accessible
3. Verify database user has proper permissions
4. Review migration files for syntax errors
5. Try rolling back and reapplying:
   ```bash
   npm run db:push
   ```

### File Upload Issues

**Problem:** Face recognition models or uploads fail

**Solutions:**
1. Verify models are downloaded during build
2. Check `/tmp` directory is being used for storage
3. Verify model files exist in `public/models/`
4. Check file size limits aren't exceeded
5. Review storage configuration in [`server/storage.ts`](../server/storage.ts)

### Performance Issues

**Problem:** Application is slow or unresponsive

**Solutions:**
1. Free tier has limited resources (512MB RAM)
2. Monitor memory usage in Render dashboard
3. Optimize database queries (check indexes)
4. Consider upgrading to paid tier for better performance
5. Enable caching where appropriate
6. Review and optimize face recognition processing

---

## Post-Deployment Checklist

- [ ] Application is accessible at Render URL
- [ ] Health check endpoint returns success
- [ ] Database connection is working
- [ ] Database migrations completed successfully
- [ ] All environment variables are set
- [ ] Cron job is configured and running
- [ ] Login functionality works
- [ ] Employee registration works
- [ ] Attendance recording works
- [ ] Face recognition models are loaded
- [ ] Logs show no critical errors
- [ ] CORS is properly configured
- [ ] HTTPS is working (automatic on Render)

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [cron-job.org Help](https://cron-job.org/en/documentation/)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/FaceSenseAttend/issues)
2. Review application logs in Render dashboard
3. Check Supabase project logs
4. Verify all configuration steps were followed
5. Create a new issue with detailed error information

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit secrets to Git**
   - Use environment variables for all sensitive data
   - Keep `.env` files in `.gitignore`
   - Rotate secrets if accidentally exposed

2. **Database Security**
   - Use strong passwords for database access
   - Limit database access to Render IPs if possible
   - Regularly backup your database

3. **API Keys**
   - Keep Service Role Key private (server-side only)
   - Anon Key can be used client-side but has limited permissions
   - Never expose JWT_SECRET or ENCRYPTION_KEY

4. **HTTPS Only**
   - Always use HTTPS in production
   - Render provides free SSL certificates
   - Ensure `ALLOWED_ORIGINS` uses HTTPS

---

## Cost Optimization

Both Render and Supabase offer generous free tiers:

**Render Free Tier Limits:**
- 750 hours per month (25 days)
- 512MB RAM
- Services sleep after 15 minutes of inactivity
- Slower cold starts

**Supabase Free Tier Limits:**
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users
- 7-day log retention

**Tips to Stay Within Free Tier:**
- Use cron jobs to prevent sleep (within limits)
- Optimize database queries
- Clean up old data regularly
- Monitor usage in both dashboards
- Consider upgrading if you exceed limits

---

*Last updated: 2025-01-15*