-- Production Database Seed Data
-- This file contains minimal production-ready data

-- Insert initial contest configuration
INSERT INTO contests (
  week_id,
  start_time,
  end_time,
  status,
  entry_fee,
  prize_pool,
  max_participants,
  contest_type
) VALUES (
  1,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '8 days',
  'upcoming',
  0.1,
  0.0,
  1000,
  'paid'
) ON CONFLICT (week_id) DO NOTHING;

-- Insert booster types configuration
INSERT INTO boosters (
  owner_address,
  booster_type,
  effect_type,
  effect_value,
  duration_hours,
  status
) VALUES 
  ('0x0000000000000000', 'disney_energy', 'score_multiplier', 1.05, 168, 'template'),
  ('0x0000000000000000', 'disney_luck', 'random_bonus', 50.0, 168, 'template'),
  ('0x0000000000000000', 'shotcaller_power', 'extra_points', 25.0, 168, 'template'),
  ('0x0000000000000000', 'shotcaller_multiplier', 'score_multiplier', 1.10, 168, 'template')
ON CONFLICT DO NOTHING;

-- Create indexes for production performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lineups_user_week ON lineups(user_id, week_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lineups_week_points ON lineups(week_id, total_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasury_type_date ON treasury_transactions(transaction_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boosters_owner_status ON boosters(owner_address, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_premium_user_status ON premium_access(user_address, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_stats_date_sport ON player_stats(game_date, sport);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create RLS policies for lineups table
CREATE POLICY "Users can view their own lineups" ON lineups
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

CREATE POLICY "Users can insert their own lineups" ON lineups
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Create RLS policies for marketplace listings
CREATE POLICY "Anyone can view active listings" ON marketplace_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own listings" ON marketplace_listings
  FOR ALL USING (seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create RLS policies for boosters
CREATE POLICY "Users can view their own boosters" ON boosters
  FOR SELECT USING (
    owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR owner_address = '0x0000000000000000' -- Template boosters
  );

CREATE POLICY "Users can manage their own boosters" ON boosters
  FOR ALL USING (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create RLS policies for premium access
CREATE POLICY "Users can view their own premium access" ON premium_access
  FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can manage their own premium access" ON premium_access
  FOR ALL USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;