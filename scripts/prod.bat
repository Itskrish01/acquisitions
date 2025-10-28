@echo off
REM Production deployment script for Acquisition App
REM This script starts the application in production mode with Neon Cloud Database

echo 🚀 Starting Acquisition App in Production Mode
echo ===============================================

REM Check if .env.production exists
if not exist .env.production (
    echo ❌ Error: .env.production file not found!
    echo    Please create .env.production with your production environment variables.
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running!
    echo    Please start Docker and try again.
    exit /b 1
)

echo 📦 Building and starting production container...
echo    - Using Neon Cloud Database (no local proxy)
echo    - Running in optimized production mode
echo.

REM Start production environment
docker compose -f docker-compose.prod.yml up --build -d

REM Wait for DB to be ready (basic health check)
echo ⏳ Waiting for Neon Local to be ready...
timeout /t 5 /nobreak >nul

REM Run migrations with Drizzle
echo 📜 Applying latest schema with Drizzle...
call bun run db:migrate

echo.
echo 🎉 Production environment started!
echo    Application: http://localhost:3000
echo    Logs: docker logs acquisition-app-prod
echo.
echo Useful commands:
echo    View logs: docker logs -f acquisition-app-prod
echo    Stop app: docker compose -f docker-compose.prod.yml down
