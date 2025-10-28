# Quick Start Guide

## Development (Local with Neon Local)

1. **Add your Neon credentials to `.env.development`:**
   ```env
   NEON_API_KEY=your_neon_api_key
   NEON_PROJECT_ID=your_neon_project_id
   PARENT_BRANCH_ID=main
   ```

2. **Start the development environment:**
   ```powershell
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Access your app:** http://localhost:3000

4. **Stop the environment:**
   ```powershell
   docker-compose -f docker-compose.dev.yml down
   ```

## Production (Neon Cloud)

1. **Add your Neon Cloud URL to `.env.production`:**
   ```env
   DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **Start the production environment:**
   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **View logs:**
   ```powershell
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## Useful Commands

```powershell
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Shell into container
docker-compose -f docker-compose.dev.yml exec app sh

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

For detailed documentation, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)
