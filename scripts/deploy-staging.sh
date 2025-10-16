#!/bin/bash

# Staging Deployment Script
# This script handles the staging deployment process

set -e

echo "🚀 Starting staging deployment..."

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN environment variable is required"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
echo "🧪 Running tests..."
pnpm test --run

# Build the application
echo "🏗️ Building application..."
NODE_ENV=production NEXT_PUBLIC_APP_URL=https://shotcaller-fantasy-game-staging.vercel.app NEXT_PUBLIC_ENVIRONMENT=staging pnpm build

# Deploy to Vercel staging
echo "🚀 Deploying to Vercel staging..."
npx vercel --target staging --token $VERCEL_TOKEN --yes

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Run health check
echo "🏥 Running health check..."
if curl -f https://shotcaller-fantasy-game-staging.vercel.app/api/health/production; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Staging deployment completed successfully!"
echo "🌐 Staging URL: https://shotcaller-fantasy-game-staging.vercel.app"