# ShotCaller Fantasy Game - Production Deployment Guide

This guide covers the complete production deployment process for the ShotCaller Fantasy Game application.

## Prerequisites

### Required Accounts and Services
- **Vercel Account**: For frontend hosting
- **Supabase Account**: For production database
- **Redis Cloud Account**: For caching (optional but recommended)
- **GitHub Account**: For CI/CD pipelines
- **Sentry Account**: For error monitoring (optional)

### Required Environment Variables

#### Vercel Environment Variables
Set these in your Vercel dashboard under Project Settings > Environment Variables:

```bash
# Sports Data APIs
NBA_API_KEY=your_nba_api_key
NBA_API_BASE_URL=https://api.balldontlie.io/v1
NFL_API_KEY=your_nfl_api_key
NFL_API_BASE_URL=https://api.sportsdata.io/v3/nfl

# Supabase Production
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Redis (Optional)
REDIS_URL=your_production_redis_url

# Flow Blockchain
FLOW_ACCESS_API_URL=https://rest-mainnet.onflow.org
FLOW_PRIVATE_KEY=your_production_flow_private_key
FLOW_ACCOUNT_ADDRESS=your_production_flow_account_address

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://shotcaller-fantasy-game.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

#### GitHub Secrets
Set these in your GitHub repository under Settings > Secrets and Variables > Actions:

```bash
# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Testing Environment
SUPABASE_TEST_URL=your_test_supabase_url
SUPABASE_TEST_ANON_KEY=your_test_supabase_anon_key
```

## Deployment Process

### 1. Automatic Deployment (Recommended)

The application uses GitHub Actions for automated CI/CD:

1. **Push to `develop` branch**: Triggers staging deployment
2. **Push to `main` branch**: Triggers production deployment after tests pass

### 2. Manual Deployment

#### Production Deployment
```bash
# Set required environment variables
export VERCEL_TOKEN=your_vercel_token
export VERCEL_ORG_ID=your_vercel_org_id
export VERCEL_PROJECT_ID=your_vercel_project_id

# Run deployment script
./scripts/deploy-production.sh
```

#### Staging Deployment
```bash
# Set required environment variables
export VERCEL_TOKEN=your_vercel_token

# Run staging deployment script
./scripts/deploy-staging.sh
```

### 3. Database Setup

#### Initial Production Database Setup
```bash
# Set environment variables
export SUPABASE_URL=your_production_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Run database setup
pnpm tsx scripts/setup-production-db.ts
```

#### Database Migrations
```bash
# Run migrations
pnpm db:migrate

# Seed production data
pnpm db:seed
```

## Monitoring and Health Checks

### Health Check Endpoints
- **Application Health**: `https://your-domain.com/api/health/production`
- **System Metrics**: `https://your-domain.com/api/admin/monitoring` (requires authentication)

### Monitoring Dashboard
Access monitoring metrics through the admin API:

```bash
curl -H "Authorization: Bearer your_admin_token" \
  https://your-domain.com/api/admin/monitoring
```

### Error Tracking
Errors are automatically logged and can be monitored through:
- Application logs in Vercel dashboard
- Sentry dashboard (if configured)
- Custom monitoring endpoint

## Performance Optimization

### Caching Strategy
- **Redis**: API responses and NFT data
- **Vercel Edge Cache**: Static assets and API responses
- **Browser Cache**: Images and static resources

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling for efficient database connections
- Row Level Security (RLS) for data protection

### Image Optimization
- Next.js Image component with WebP support
- Optimized image sizes for different devices
- CDN delivery through Vercel

## Security Considerations

### Environment Variables
- Never commit sensitive environment variables
- Use Vercel's environment variable encryption
- Rotate API keys regularly

### Database Security
- Row Level Security (RLS) enabled
- Proper authentication and authorization
- Regular security audits

### API Security
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration

## Troubleshooting

### Common Issues

#### Deployment Failures
1. Check environment variables are set correctly
2. Verify build process completes successfully
3. Check Vercel deployment logs

#### Database Connection Issues
1. Verify Supabase URL and keys
2. Check database connection limits
3. Ensure proper network configuration

#### API Failures
1. Check external API keys and limits
2. Verify network connectivity
3. Check rate limiting settings

### Rollback Process
If deployment fails or issues arise:

1. **Immediate Rollback**: Use Vercel dashboard to rollback to previous deployment
2. **Database Rollback**: Restore from Supabase backup if needed
3. **Code Rollback**: Revert commits and redeploy

## Maintenance

### Regular Tasks
- Monitor application performance and errors
- Update dependencies and security patches
- Review and rotate API keys
- Backup database regularly
- Monitor resource usage and costs

### Scaling Considerations
- Monitor Vercel function execution limits
- Consider database connection pooling
- Implement caching strategies
- Monitor API rate limits

## Support and Documentation

### Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flow Blockchain Documentation](https://developers.flow.com/)

### Getting Help
1. Check application logs in Vercel dashboard
2. Review error tracking in Sentry (if configured)
3. Check GitHub Issues for known problems
4. Contact development team for support

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Security audit completed
- [ ] Performance testing completed

### Deployment
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Database setup completed
- [ ] Monitoring configured

### Post-Deployment
- [ ] Application accessible
- [ ] All features working
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] Monitoring alerts configured