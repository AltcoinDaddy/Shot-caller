# ShotCaller Database Setup

This directory contains the database schema, migrations, and seed data for the ShotCaller fantasy sports platform.

## Overview

The database is built on Supabase (PostgreSQL) and includes comprehensive tables for:

- **Users**: Player accounts and profiles
- **NFTs**: NBA Top Shot and NFL All Day moments
- **Lineups**: Fantasy team configurations
- **Contests**: Weekly tournaments and competitions
- **Treasury Transactions**: FLOW token payments and fee routing
- **Marketplace Listings**: NFT trading and sales
- **Boosters**: Power-ups and gameplay enhancements
- **Premium Access**: Subscription and premium features
- **Player Stats**: Real-world athlete performance data

## Database Schema

### Core Tables

#### Users
- User accounts linked to wallet addresses
- Performance tracking (wins, losses, points)
- Season rankings and statistics

#### NFTs
- NBA and NFL player moments
- Metadata and rarity information
- Player details and team affiliations

#### Lineups
- User team configurations (up to 5 NFTs)
- Weekly contest submissions
- Scoring and performance tracking

#### Contests
- Tournament management and scheduling
- Entry fees and prize pool tracking
- Participant limits and status management

### Revenue Model Tables

#### Treasury Transactions
- All FLOW token transactions
- Automatic fee routing (70% reward pool, 30% treasury)
- Transaction type tracking and audit trail

#### Marketplace Listings
- NFT trading and sales
- Price history and transaction records
- Seller/buyer relationship tracking

#### Boosters
- Power-up purchases and inventory
- Effect types and duration tracking
- Disney Pinnacle NFT integration

#### Premium Access
- Season pass and subscription management
- Feature access control
- Renewal and expiration tracking

## Setup Instructions

### Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Database Setup

#### Option 1: Using npm scripts (Recommended)

```bash
# Check database connection
pnpm run db:check

# Run migrations (create tables and indexes)
pnpm run db:migrate

# Seed with test data
pnpm run db:seed

# Full setup (migrations + seeds)
pnpm run db:setup

# Reset database (WARNING: deletes all data)
pnpm run db:reset
```

#### Option 2: Using API endpoints

You can also manage the database through API endpoints:

```bash
# Check database status
curl http://localhost:3000/api/admin/database

# Run migrations
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}'

# Full setup
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -d '{"action": "setup"}'
```

#### Option 3: Manual SQL execution

You can also run the SQL files directly in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of migration files in order:
   - `001_initial_schema.sql`
   - `002_enhanced_indexes.sql`
4. Run the seed files:
   - `001_initial_data.sql`
   - `002_comprehensive_test_data.sql`

## File Structure

```
lib/database/
├── README.md                           # This file
├── migrate.ts                          # Migration runner utility
├── migrations/
│   ├── 001_initial_schema.sql         # Core table definitions
│   └── 002_enhanced_indexes.sql       # Performance indexes and constraints
└── seeds/
    ├── 001_initial_data.sql           # Basic test data
    └── 002_comprehensive_test_data.sql # Extensive test data for revenue features
```

## Key Features

### Security
- Row Level Security (RLS) policies
- User data isolation
- Secure wallet address validation
- Input sanitization and validation

### Performance
- Comprehensive indexing strategy
- Optimized query patterns
- Connection pooling support
- Efficient data relationships

### Revenue Model Integration
- Automatic fee calculation and routing
- Treasury balance tracking
- Marketplace transaction history
- Premium feature access control

### Data Integrity
- Foreign key constraints
- Check constraints for business rules
- Unique constraints to prevent duplicates
- Proper data types and validation

## API Integration

The database is fully integrated with the Next.js API routes:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users`
- **NFTs**: `/api/nfts`
- **Contests**: `/api/contests/*`
- **Lineups**: `/api/lineups/*`
- **Marketplace**: `/api/marketplace/*`
- **Treasury**: `/api/treasury/*`
- **Boosters**: `/api/boosters/*`
- **Premium**: `/api/premium/*`
- **Stats**: `/api/stats`

## Development Workflow

1. **Local Development**: Use the seed data for testing
2. **Schema Changes**: Add new migrations for database updates
3. **Testing**: Use the comprehensive test data for feature validation
4. **Production**: Run migrations on production Supabase instance

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify Supabase URL and API key
2. **Permission Errors**: Check RLS policies and user authentication
3. **Migration Failures**: Ensure migrations run in correct order
4. **Seed Data Issues**: Reset database and re-run setup

### Debugging

```bash
# Check database connection
pnpm run db:check

# View detailed error logs
# Check browser console or server logs for specific error messages

# Reset and start fresh
pnpm run db:reset
pnpm run db:setup
```

## Production Considerations

1. **Backup Strategy**: Regular database backups
2. **Migration Management**: Version control for schema changes
3. **Performance Monitoring**: Query performance and optimization
4. **Security Audits**: Regular security reviews and updates
5. **Scaling**: Connection pooling and read replicas as needed

## Support

For issues with database setup or configuration:

1. Check the Supabase documentation
2. Review the API endpoint implementations
3. Examine the enhanced database service for query patterns
4. Test with the provided seed data

The database is designed to be robust, scalable, and fully integrated with the ShotCaller platform's revenue model and gameplay features.