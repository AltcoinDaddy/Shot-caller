-- ShotCaller Seed Data
-- This file contains initial data for testing the revenue model features

-- Insert sample NFTs for testing
INSERT INTO nfts (moment_id, player_name, team, position, sport, rarity, metadata) VALUES
-- NBA Players
(1001, 'LeBron James', 'Lakers', 'SF', 'NBA', 'Legendary', '{"season": "2023-24", "series": "Base Set", "play_type": "Dunk"}'),
(1002, 'Stephen Curry', 'Warriors', 'PG', 'NBA', 'Epic', '{"season": "2023-24", "series": "Base Set", "play_type": "3-Pointer"}'),
(1003, 'Giannis Antetokounmpo', 'Bucks', 'PF', 'NBA', 'Epic', '{"season": "2023-24", "series": "Base Set", "play_type": "Dunk"}'),
(1004, 'Luka Dončić', 'Mavericks', 'PG', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Assist"}'),
(1005, 'Jayson Tatum', 'Celtics', 'SF', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Jump Shot"}'),
(1006, 'Nikola Jokić', 'Nuggets', 'C', 'NBA', 'Epic', '{"season": "2023-24", "series": "Base Set", "play_type": "Pass"}'),
(1007, 'Joel Embiid', 'Sixers', 'C', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Block"}'),
(1008, 'Ja Morant', 'Grizzlies', 'PG', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Layup"}'),

-- NFL Players
(2001, 'Patrick Mahomes', 'Chiefs', 'QB', 'NFL', 'Legendary', '{"season": "2023", "series": "Base Set", "play_type": "Touchdown Pass"}'),
(2002, 'Josh Allen', 'Bills', 'QB', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Rushing TD"}'),
(2003, 'Justin Jefferson', 'Vikings', 'WR', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Catch"}'),
(2004, 'Cooper Kupp', 'Rams', 'WR', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Reception"}'),
(2005, 'Derrick Henry', 'Titans', 'RB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Rush"}'),
(2006, 'Aaron Donald', 'Rams', 'DT', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Sack"}'),
(2007, 'T.J. Watt', 'Steelers', 'LB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Tackle"}'),
(2008, 'Davante Adams', 'Raiders', 'WR', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Touchdown"}');

-- Insert sample contests
INSERT INTO contests (week_id, start_time, end_time, status, entry_fee, prize_pool, contest_type) VALUES
(1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'active', 0, 0, 'free'),
(2, NOW() + INTERVAL '6 days', NOW() + INTERVAL '13 days', 'upcoming', 5.0, 0, 'paid'),
(3, NOW() + INTERVAL '13 days', NOW() + INTERVAL '20 days', 'upcoming', 10.0, 0, 'premium');

-- Insert sample player stats for testing scoring
INSERT INTO player_stats (player_name, game_date, sport, stats, fantasy_points) VALUES
-- NBA stats (points, rebounds, assists, steals, blocks)
('LeBron James', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 28, "rebounds": 8, "assists": 7, "steals": 2, "blocks": 1}', 46.0),
('Stephen Curry', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 32, "rebounds": 4, "assists": 6, "steals": 1, "blocks": 0}', 43.0),
('Giannis Antetokounmpo', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 35, "rebounds": 12, "assists": 5, "steals": 1, "blocks": 2}', 55.0),
('Luka Dončić', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 25, "rebounds": 9, "assists": 11, "steals": 2, "blocks": 0}', 47.0),
('Jayson Tatum', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 30, "rebounds": 6, "assists": 4, "steals": 1, "blocks": 1}', 42.0),

-- NFL stats (passing_yards, rushing_yards, receiving_yards, touchdowns)
('Patrick Mahomes', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"passing_yards": 325, "rushing_yards": 15, "touchdowns": 3, "interceptions": 0}', 32.0),
('Josh Allen', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"passing_yards": 280, "rushing_yards": 45, "touchdowns": 2, "interceptions": 1}', 26.5),
('Justin Jefferson', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"receiving_yards": 120, "receptions": 8, "touchdowns": 1, "targets": 12}', 24.0),
('Cooper Kupp', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"receiving_yards": 95, "receptions": 7, "touchdowns": 0, "targets": 10}', 16.5),
('Derrick Henry', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"rushing_yards": 135, "carries": 22, "touchdowns": 2, "fumbles": 0}', 25.5);

-- Insert sample booster types for marketplace
INSERT INTO boosters (owner_address, booster_type, effect_type, effect_value, status) VALUES
('0x1234567890123456789012345678901234567890', 'disney_energy', 'score_multiplier', 1.05, 'available'),
('0x1234567890123456789012345678901234567890', 'disney_luck', 'random_bonus', 10.0, 'available'),
('0x2345678901234567890123456789012345678901', 'shotcaller_power', 'extra_points', 5.0, 'available'),
('0x2345678901234567890123456789012345678901', 'shotcaller_multiplier', 'score_multiplier', 1.10, 'available');

-- Insert sample marketplace listings
INSERT INTO marketplace_listings (seller_address, moment_id, price, status) VALUES
('0x1234567890123456789012345678901234567890', 1007, 25.0, 'active'),
('0x2345678901234567890123456789012345678901', 1008, 15.0, 'active'),
('0x3456789012345678901234567890123456789012', 2007, 30.0, 'active'),
('0x4567890123456789012345678901234567890123', 2008, 20.0, 'active');

-- Insert sample treasury transactions
INSERT INTO treasury_transactions (transaction_hash, transaction_type, amount, fee_amount, reward_pool_amount, treasury_amount, user_address) VALUES
('0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz567', 'tournament_entry', 10.0, 0.0, 7.0, 3.0, '0x1234567890123456789012345678901234567890'),
('0xdef456ghi789jkl012mno345pqr678stu901vwx234yz567abc123', 'marketplace_sale', 25.0, 1.25, 0.875, 0.375, '0x2345678901234567890123456789012345678901'),
('0xghi789jkl012mno345pqr678stu901vwx234yz567abc123def456', 'booster_purchase', 5.0, 0.0, 3.5, 1.5, '0x3456789012345678901234567890123456789012'),
('0xjkl012mno345pqr678stu901vwx234yz567abc123def456ghi789', 'season_pass', 50.0, 0.0, 35.0, 15.0, '0x4567890123456789012345678901234567890123');

-- Insert sample premium access
INSERT INTO premium_access (user_address, access_type, expires_at, flow_amount) VALUES
('0x1234567890123456789012345678901234567890', 'season_pass', NOW() + INTERVAL '90 days', 50.0),
('0x2345678901234567890123456789012345678901', 'monthly_premium', NOW() + INTERVAL '30 days', 15.0);