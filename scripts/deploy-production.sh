#!/bin/bash

# Production Deployment Script
# This script handles the complete production deployment process

set -e

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "❌ VERCEL_ORG_ID environment variable is required"
    exit 1
fi

if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ VERCEL_PROJECT_ID environment variable is required"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
echo "🧪 Running tests..."
pnpm test --run

# Run linting
echo "🔍 Running linting..."
pnpm lint

# Build the application
echo "🏗️ Building application..."
NODE_ENV=production NEXT_PUBLIC_APP_URL=https://shotcaller-fantasy-game.vercel.app pnpm build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod --token $VERCEL_TOKEN --yes

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Run health check
echo "🏥 Running health check..."
if curl -f https://shotcaller-fantasy-game.vercel.app/api/health/production; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    exit 1
fi

# Run post-deployment tests
echo "🧪 Running post-deployment tests..."
NEXT_PUBLIC_APP_URL=https://shotcaller-fantasy-game.vercel.app pnpm test:e2e --run

echo "🎉 Production deployment completed successfully!"
echo "🌐 Application is live at: https://shotcaller-fantasy-game.vercel.app"