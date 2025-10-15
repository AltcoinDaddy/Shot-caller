-- Enhanced Database Indexes and Constraints
-- This migration adds additional indexes and constraints for better performance and data integrity

-- Additional indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lineups_user_week ON lineups(user_id, week_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lineups_total_points ON lineups(total_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lineups_submitted_at ON lineups(submitted_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_start_time ON contests(start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_end_time ON contests(end_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_entry_fee ON contests(entry_fee);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_prize_pool ON contests(prize_pool DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasury_created_at ON treasury_transactions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasury_amount ON treasury_transactions(amount DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_moment_id ON marketplace_listings(moment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_price ON marketplace_listings(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_created_at ON marketplace_listings(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boosters_expires_at ON boosters(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boosters_activated_at ON boosters(activated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boosters_type ON boosters(booster_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_premium_expires_at ON premium_access(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_premium_access_type ON premium_access(access_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_stats_fantasy_points ON player_stats(fantasy_points DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_sport_rarity ON nfts(sport, rarity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_status_price ON marketplace_listings(status, price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boosters_owner_status ON boosters(owner_address, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasury_type_created ON treasury_transactions(transaction_type, created_at DESC);

-- Add constraints for data integrity
ALTER TABLE lineups ADD CONSTRAINT check_nft_ids_not_empty CHECK (array_length(nft_ids, 1) > 0);
ALTER TABLE lineups ADD CONSTRAINT check_nft_ids_max_five CHECK (array_length(nft_ids, 1) <= 5);
ALTER TABLE lineups ADD CONSTRAINT check_total_points_non_negative CHECK (total_points >= 0);

ALTER TABLE contests ADD CONSTRAINT check_start_before_end CHECK (start_time < end_time);
ALTER TABLE contests ADD CONSTRAINT check_entry_fee_non_negative CHECK (entry_fee >= 0);
ALTER TABLE contests ADD CONSTRAINT check_prize_pool_non_negative CHECK (prize_pool >= 0);
ALTER TABLE contests ADD CONSTRAINT check_max_participants_positive CHECK (max_participants IS NULL OR max_participants > 0);

ALTER TABLE treasury_transactions ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
ALTER TABLE treasury_transactions ADD CONSTRAINT check_fee_amount_non_negative CHECK (fee_amount IS NULL OR fee_amount >= 0);

ALTER TABLE marketplace_listings ADD CONSTRAINT check_price_positive CHECK (price > 0);
ALTER TABLE marketplace_listings ADD CONSTRAINT check_sold_at_after_created CHECK (sold_at IS NULL OR sold_at >= created_at);

ALTER TABLE boosters ADD CONSTRAINT check_effect_value_positive CHECK (effect_value > 0);
ALTER TABLE boosters ADD CONSTRAINT check_duration_positive CHECK (duration_hours > 0);
ALTER TABLE boosters ADD CONSTRAINT check_expires_after_activated CHECK (expires_at IS NULL OR activated_at IS NULL OR expires_at > activated_at);

ALTER TABLE premium_access ADD CONSTRAINT check_expires_after_purchased CHECK (expires_at > purchased_at);
ALTER TABLE premium_access ADD CONSTRAINT check_flow_amount_positive CHECK (flow_amount > 0);

-- Add unique constraints to prevent duplicates
ALTER TABLE lineups ADD CONSTRAINT unique_user_week_lineup UNIQUE (user_id, week_id);
ALTER TABLE marketplace_listings ADD CONSTRAINT unique_active_moment_listing UNIQUE (moment_id, status) WHERE status = 'active';

-- Add check constraints for enum-like fields
ALTER TABLE contests ADD CONSTRAINT check_status_valid CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'));
ALTER TABLE contests ADD CONSTRAINT check_contest_type_valid CHECK (contest_type IN ('free', 'paid', 'premium', 'sponsored'));

ALTER TABLE marketplace_listings ADD CONSTRAINT check_listing_status_valid CHECK (status IN ('active', 'sold', 'cancelled', 'expired'));

ALTER TABLE boosters ADD CONSTRAINT check_booster_type_valid CHECK (booster_type IN ('disney_energy', 'disney_luck', 'shotcaller_power', 'shotcaller_multiplier'));
ALTER TABLE boosters ADD CONSTRAINT check_effect_type_valid CHECK (effect_type IN ('score_multiplier', 'random_bonus', 'extra_points'));
ALTER TABLE boosters ADD CONSTRAINT check_booster_status_valid CHECK (status IN ('available', 'active', 'expired', 'used'));

ALTER TABLE premium_access ADD CONSTRAINT check_access_type_valid CHECK (access_type IN ('season_pass', 'monthly_premium', 'tournament_vip'));
ALTER TABLE premium_access ADD CONSTRAINT check_premium_status_valid CHECK (status IN ('active', 'expired', 'cancelled'));

ALTER TABLE treasury_transactions ADD CONSTRAINT check_transaction_type_valid CHECK (transaction_type IN ('tournament_entry', 'marketplace_sale', 'booster_purchase', 'season_pass', 'reward_distribution'));

ALTER TABLE nfts ADD CONSTRAINT check_sport_valid CHECK (sport IN ('NBA', 'NFL'));
ALTER TABLE player_stats ADD CONSTRAINT check_stats_sport_valid CHECK (sport IN ('NBA', 'NFL'));

-- Create views for common queries
CREATE OR REPLACE VIEW active_contests AS
SELECT * FROM contests 
WHERE status IN ('upcoming', 'active') 
ORDER BY start_time;

CREATE OR REPLACE VIEW active_marketplace_listings AS
SELECT ml.*, n.player_name, n.team, n.position, n.sport, n.rarity
FROM marketplace_listings ml
JOIN nfts n ON ml.moment_id = n.moment_id
WHERE ml.status = 'active'
ORDER BY ml.created_at DESC;

CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.wallet_address,
    u.username,
    u.total_points,
    u.season_rank,
    u.wins,
    u.losses,
    CASE WHEN (u.wins + u.losses) > 0 THEN ROUND(u.wins::decimal / (u.wins + u.losses), 3) ELSE 0 END as win_rate,
    COUNT(l.id) as total_lineups,
    COALESCE(SUM(tt.amount) FILTER (WHERE tt.transaction_type = 'reward_distribution'), 0) as total_rewards,
    COALESCE(SUM(tt.amount) FILTER (WHERE tt.transaction_type = 'tournament_entry'), 0) as total_entries
FROM users u
LEFT JOIN lineups l ON u.id = l.user_id
LEFT JOIN treasury_transactions tt ON u.wallet_address = tt.user_address
GROUP BY u.id, u.wallet_address, u.username, u.total_points, u.season_rank, u.wins, u.losses;

-- Create function to update contest status based on time
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS void AS $$
BEGIN
    -- Update upcoming contests to active
    UPDATE contests 
    SET status = 'active' 
    WHERE status = 'upcoming' 
    AND start_time <= NOW();
    
    -- Update active contests to completed
    UPDATE contests 
    SET status = 'completed' 
    WHERE status = 'active' 
    AND end_time <= NOW();
    
    -- Lock lineups for completed contests
    UPDATE lineups 
    SET locked = true 
    WHERE week_id IN (
        SELECT week_id FROM contests 
        WHERE status = 'completed' 
        AND end_time <= NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to expire boosters
CREATE OR REPLACE FUNCTION expire_boosters()
RETURNS void AS $$
BEGIN
    UPDATE boosters 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to expire premium access
CREATE OR REPLACE FUNCTION expire_premium_access()
RETURNS void AS $$
BEGIN
    UPDATE premium_access 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON active_contests TO anon, authenticated;
GRANT SELECT ON active_marketplace_listings TO anon, authenticated;
GRANT SELECT ON user_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE nfts IS 'NFT moments from NBA Top Shot and NFL All Day';
COMMENT ON TABLE lineups IS 'User lineups for fantasy contests';
COMMENT ON TABLE contests IS 'Fantasy contests and tournaments';
COMMENT ON TABLE treasury_transactions IS 'All FLOW token transactions and fee routing';
COMMENT ON TABLE marketplace_listings IS 'NFT marketplace listings and sales';
COMMENT ON TABLE boosters IS 'Power-ups and boosters for enhanced gameplay';
COMMENT ON TABLE premium_access IS 'Premium subscription and access records';
COMMENT ON TABLE player_stats IS 'Real-world player statistics for scoring';

COMMENT ON VIEW active_contests IS 'Currently available contests for joining';
COMMENT ON VIEW active_marketplace_listings IS 'Active NFT listings with player details';
COMMENT ON VIEW user_stats IS 'Comprehensive user statistics and performance metrics';