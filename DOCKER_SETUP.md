# Docker Setup with Neon Database

This guide explains how to run the application using Docker with Neon Database in both development and production environments.

## Overview

- **Development**: Uses Neon Local proxy to create ephemeral database branches
- **Production**: Connects directly to Neon Cloud database

## Prerequisites

- Docker and Docker Compose installed
- Neon account with a project created
- Neon API key (get it from [Neon Console](https://console.neon.tech/app/settings/api-keys))

## Development Setup (with Neon Local)

### 1. Configure Environment Variables

Copy the development environment template:

```bash
# If .env.development doesn't exist, it's already created
```

Edit `.env.development` and add your Neon credentials:

```env
NEON_API_KEY=your_actual_neon_api_key
NEON_PROJECT_ID=your_actual_project_id
PARENT_BRANCH_ID=main
```

**Where to find these values:**
- `NEON_API_KEY`: [Neon Console → Account Settings → API Keys](https://console.neon.tech/app/settings/api-keys)
- `NEON_PROJECT_ID`: Neon Console → Select your project → Settings → General
- `PARENT_BRANCH_ID`: The branch name you want to use as parent (usually `main`)

### 2. Update .gitignore

Add the following to your `.gitignore`:

```gitignore
.neon_local/
.env.development
.env.production
```

### 3. Start the Development Environment

```bash
docker-compose -f docker-compose.dev.yml up
```

Or run in detached mode:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. What Happens in Development

1. **Neon Local container starts** and creates an ephemeral database branch
2. **Application container starts** and connects to `neon-local:5432`
3. Your app uses a fresh database copy for development
4. When you stop the containers, the ephemeral branch is automatically deleted

### 5. Run Database Migrations (Development)

```bash
# Generate migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### 6. View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# App only
docker-compose -f docker-compose.dev.yml logs -f app

# Neon Local only
docker-compose -f docker-compose.dev.yml logs -f neon-local
```

### 7. Stop Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

## Production Setup (with Neon Cloud)

### 1. Configure Production Environment

Edit `.env.production` and add your Neon Cloud database URL:

```env
DATABASE_URL=postgres://user:password@ep-xyz-123.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secure_jwt_secret_here
```

**Where to find the DATABASE_URL:**
- Neon Console → Select your project → Dashboard → Connection Details
- Use the "Pooled connection" string for production

⚠️ **IMPORTANT**: Never commit `.env.production` with real credentials to version control!

### 2. Build and Run Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Run Database Migrations (Production)

```bash
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### 4. Production Deployment Best Practices

For production deployments, inject secrets securely:

**Option A: Using environment variables directly**
```bash
DATABASE_URL="postgres://..." JWT_SECRET="..." docker-compose -f docker-compose.prod.yml up -d
```

**Option B: Using Docker secrets (Docker Swarm)**
```yaml
services:
  app:
    secrets:
      - database_url
      - jwt_secret
    environment:
      DATABASE_URL_FILE: /run/secrets/database_url
```

**Option C: Using cloud provider secret management**
- AWS: Use AWS Secrets Manager or Parameter Store
- Azure: Use Azure Key Vault
- GCP: Use Google Secret Manager

## Connection Strings Reference

### Development (Neon Local)
```
postgres://neon:npg@neon-local:5432/neondb?sslmode=require
```
- Host: `neon-local` (Docker service name)
- Port: `5432`
- User: `neon`
- Password: `npg`
- Database: `neondb` (or your database name)

### Production (Neon Cloud)
```
postgres://user:password@ep-xyz-123.region.aws.neon.tech/neondb?sslmode=require
```
- Use the actual connection string from Neon Console
- Always use SSL mode in production

## Using Neon Serverless Driver

If your application uses the Neon serverless driver (`@neondatabase/serverless`), you'll need to configure it differently:

### Development with Neon Local

```javascript
import { neon, neonConfig } from '@neondatabase/serverless';

if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);
```

### Production (no changes needed)

```javascript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

## Troubleshooting

### Issue: Cannot connect to Neon Local

**Solution**: Ensure Neon Local is healthy
```bash
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs neon-local
```

### Issue: ECONNREFUSED on Windows

**Solution**: Check that Docker Desktop is running and WSL2 backend is enabled.

### Issue: SSL certificate error with JavaScript

**Solution**: If using `pg` library, add SSL configuration:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'development' 
    ? { rejectUnauthorized: false } 
    : true
});
```

### Issue: Ephemeral branch not deleted

**Solution**: Ensure `DELETE_BRANCH` is set to `'true'` in docker-compose.dev.yml

### Issue: Permission denied on volumes

**Solution**: On Linux, ensure proper permissions:
```bash
mkdir -p .neon_local logs
chmod -R 777 .neon_local logs
```

## Persistent Branches (Optional)

If you want to keep branches between container restarts:

1. Edit `docker-compose.dev.yml`:
```yaml
environment:
  DELETE_BRANCH: 'false'
```

2. This will create one branch per Git branch and persist it

## Useful Commands

```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Shell into app container
docker-compose -f docker-compose.dev.yml exec app sh

# Check Neon Local connection
docker-compose -f docker-compose.dev.yml exec neon-local pg_isready -h localhost

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f --tail=100
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐         ┌──────────────┐      ┌──────────┐  │
│  │   App    │────────▶│  Neon Local  │─────▶│  Neon    │  │
│  │Container │         │    Proxy     │      │  Cloud   │  │
│  └──────────┘         └──────────────┘      └──────────┘  │
│       │                      │                             │
│   localhost:3000      localhost:5432                       │
│                         (Ephemeral                         │
│                          branches)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                          ┌──────────┐        │
│  │   App    │─────────────────────────▶│  Neon    │        │
│  │Container │       Direct TLS          │  Cloud   │        │
│  └──────────┘                          └──────────┘        │
│       │                                                     │
│   Port 3000                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. Set up CI/CD pipeline to build and push Docker images
2. Configure health checks for your application
3. Set up monitoring and logging (Sentry, DataDog, etc.)
4. Implement database backup strategy for production
5. Configure auto-scaling based on load

## Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Branching Guide](https://neon.com/docs/guides/branching)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
