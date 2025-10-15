# Database Setup Instructions

Since you have Supabase configured, here are the steps to set up your database:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://pcunbcvbdeludcjmqfeu.supabase.co
2. Navigate to the **SQL Editor** tab
3. Run the migration files in order:

### Step 1: Run Initial Schema
Copy and paste the contents of `lib/database/migrations/001_initial_schema.sql` into the SQL editor and execute it.

### Step 2: Run Enhanced Indexes
Copy and paste the contents of `lib/database/migrations/002_enhanced_indexes.sql` into the SQL editor and execute it.

### Step 3: Seed Initial Data
Copy and paste the contents of `lib/database/seeds/001_initial_data.sql` into the SQL editor and execute it.

### Step 4: Seed Comprehensive Test Data
Copy and paste the contents of `lib/database/seeds/002_comprehensive_test_data.sql` into the SQL editor and execute it.

## Option 2: Using the API Endpoint

Once your Next.js app is running, you can use the admin API:

```bash
# Check database connection
curl http://localhost:3000/api/admin/database

# Run full setup (this might not work due to RPC limitations)
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -d '{"action": "setup"}'
```

## Option 3: Manual Table Creation

If you prefer to create tables manually, here's the essential schema:

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    total_points INTEGER DEFAULT 0,
    season_rank INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);
```

### NFTs Table
```sql
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id BIGINT UNIQUE NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    team VARCHAR(50),
    position VARCHAR(10),
    sport VARCHAR(10) NOT NULL,
    rarity VARCHAR(20),
    metadata JSONB,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

### Contests Table
```sql
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id INTEGER UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    total_participants INTEGER DEFAULT 0,
    rewards_distributed BOOLEAN DEFAULT FALSE,
    entry_fee DECIMAL(20,8) DEFAULT 0,
    prize_pool DECIMAL(20,8) DEFAULT 0,
    max_participants INTEGER,
    contest_type VARCHAR(20) DEFAULT 'free'
);
```

### Lineups Table
```sql
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_id INTEGER NOT NULL,
    nft_ids BIGINT[] NOT NULL,
    total_points INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT NOW(),
    locked BOOLEAN DEFAULT FALSE
);
```

### Treasury Transactions Table
```sql
CREATE TABLE treasury_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash VARCHAR(64) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee_amount DECIMAL(20,8),
    reward_pool_amount DECIMAL(20,8),
    treasury_amount DECIMAL(20,8),
    user_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Marketplace Listings Table
```sql
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_address VARCHAR(42) NOT NULL,
    moment_id BIGINT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    buyer_address VARCHAR(42)
);
```

### Boosters Table
```sql
CREATE TABLE boosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_address VARCHAR(42) NOT NULL,
    booster_type VARCHAR(50) NOT NULL,
    effect_type VARCHAR(50) NOT NULL,
    effect_value DECIMAL(10,2) NOT NULL,
    duration_hours INTEGER DEFAULT 168,
    purchased_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'available'
);
```

### Premium Access Table
```sql
CREATE TABLE premium_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    access_type VARCHAR(50) NOT NULL,
    purchased_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    flow_amount DECIMAL(20,8) NOT NULL
);
```

### Player Stats Table
```sql
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name VARCHAR(100) NOT NULL,
    game_date DATE NOT NULL,
    sport VARCHAR(10) NOT NULL,
    stats JSONB NOT NULL,
    fantasy_points DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Verification

After setting up the database, you can verify it's working by:

1. Starting your Next.js app: `pnpm dev`
2. Visiting the health endpoint: http://localhost:3000/api/health
3. You should see database status as "healthy" and statistics showing your tables

## Next Steps

Once the database is set up:

1. Test the API endpoints
2. Verify user authentication works
3. Test contest creation and lineup submission
4. Test marketplace functionality
5. Verify treasury transaction tracking

The database is now ready to support all ShotCaller features including FLOW token transactions, NFT marketplace, premium subscriptions, and reward distribution!