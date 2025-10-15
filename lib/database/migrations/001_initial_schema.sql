-- ShotCaller Database Schema
-- This file contains the complete database schema for the ShotCaller fantasy sports platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    total_points INTEGER DEFAULT 0,
    season_rank INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);

-- NFTs table
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moment_id BIGINT UNIQUE NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    team VARCHAR(50),
    position VARCHAR(10),
    sport VARCHAR(10) NOT NULL,
    rarity VARCHAR(20),
    metadata JSONB,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Lineups table
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_id INTEGER NOT NULL,
    nft_ids BIGINT[] NOT NULL,
    total_points INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT NOW(),
    locked BOOLEAN DEFAULT FALSE
);

-- Contests table
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Treasury transactions table
CREATE TABLE treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(64) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee_amount DECIMAL(20,8),
    reward_pool_amount DECIMAL(20,8),
    treasury_amount DECIMAL(20,8),
    user_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace listings table
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_address VARCHAR(42) NOT NULL,
    moment_id BIGINT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    buyer_address VARCHAR(42)
);

-- Boosters table
CREATE TABLE boosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Premium access table
CREATE TABLE premium_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    access_type VARCHAR(50) NOT NULL,
    purchased_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    flow_amount DECIMAL(20,8) NOT NULL
);

-- Player stats table
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(100) NOT NULL,
    game_date DATE NOT NULL,
    sport VARCHAR(10) NOT NULL,
    stats JSONB NOT NULL,
    fantasy_points DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_nfts_moment_id ON nfts(moment_id);
CREATE INDEX idx_nfts_sport ON nfts(sport);
CREATE INDEX idx_lineups_user_id ON lineups(user_id);
CREATE INDEX idx_lineups_week_id ON lineups(week_id);
CREATE INDEX idx_contests_week_id ON contests(week_id);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_treasury_transactions_user_address ON treasury_transactions(user_address);
CREATE INDEX idx_treasury_transactions_type ON treasury_transactions(transaction_type);
CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_boosters_owner ON boosters(owner_address);
CREATE INDEX idx_boosters_status ON boosters(status);
CREATE INDEX idx_premium_access_user ON premium_access(user_address);
CREATE INDEX idx_premium_access_status ON premium_access(status);
CREATE INDEX idx_player_stats_name_date ON player_stats(player_name, game_date);
CREATE INDEX idx_player_stats_sport ON player_stats(sport);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_access ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Lineups policies
CREATE POLICY "Users can view own lineups" ON lineups FOR SELECT USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));
CREATE POLICY "Users can insert own lineups" ON lineups FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));
CREATE POLICY "Users can update own lineups" ON lineups FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Treasury transactions are read-only for users
CREATE POLICY "Users can view own transactions" ON treasury_transactions FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Marketplace policies
CREATE POLICY "Anyone can view active listings" ON marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own listings" ON marketplace_listings FOR ALL USING (seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Boosters policies
CREATE POLICY "Users can view own boosters" ON boosters FOR SELECT USING (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "Users can manage own boosters" ON boosters FOR ALL USING (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Premium access policies
CREATE POLICY "Users can view own premium access" ON premium_access FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "Users can insert own premium access" ON premium_access FOR INSERT WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');