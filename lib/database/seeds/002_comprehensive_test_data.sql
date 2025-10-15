-- Comprehensive Test Data for Revenue Model Features
-- This file contains extensive test data for all revenue model features

-- Insert test users
INSERT INTO users (wallet_address, username, total_points, wins, losses) VALUES
('0x1234567890123456789012345678901234567890', 'CryptoChamp', 1250, 8, 3),
('0x2345678901234567890123456789012345678901', 'NFTMaster', 980, 6, 5),
('0x3456789012345678901234567890123456789012', 'FlowGamer', 1450, 10, 2),
('0x4567890123456789012345678901234567890123', 'TopShotPro', 750, 4, 7),
('0x5678901234567890123456789012345678901234', 'FantasyKing', 1680, 12, 1),
('0x6789012345678901234567890123456789012345', 'BlockchainBaller', 520, 3, 8),
('0x7890123456789012345678901234567890123456', 'DisneyCollector', 890, 5, 6),
('0x8901234567890123456789012345678901234567', 'ShotCallerVIP', 1320, 9, 4);

-- Insert additional NBA NFTs
INSERT INTO nfts (moment_id, player_name, team, position, sport, rarity, metadata) VALUES
-- More NBA Legends
(1009, 'Kevin Durant', 'Suns', 'SF', 'NBA', 'Legendary', '{"season": "2023-24", "series": "Rare Set", "play_type": "Pull-up Jumper"}'),
(1010, 'Kawhi Leonard', 'Clippers', 'SF', 'NBA', 'Epic', '{"season": "2023-24", "series": "Base Set", "play_type": "Steal"}'),
(1011, 'Jimmy Butler', 'Heat', 'SF', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Layup"}'),
(1012, 'Paul George', 'Clippers', 'SF', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "3-Pointer"}'),
(1013, 'Damian Lillard', 'Bucks', 'PG', 'NBA', 'Epic', '{"season": "2023-24", "series": "Rare Set", "play_type": "Deep 3"}'),
(1014, 'Anthony Davis', 'Lakers', 'PF', 'NBA', 'Epic', '{"season": "2023-24", "series": "Base Set", "play_type": "Block"}'),
(1015, 'Zion Williamson', 'Pelicans', 'PF', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Dunk"}'),
(1016, 'Trae Young', 'Hawks', 'PG', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Assist"}'),
(1017, 'Devin Booker', 'Suns', 'SG', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Mid-range"}'),
(1018, 'Donovan Mitchell', 'Cavaliers', 'SG', 'NBA', 'Rare', '{"season": "2023-24", "series": "Base Set", "play_type": "Dunk"}'),

-- More NFL Stars
(2009, 'Lamar Jackson', 'Ravens', 'QB', 'NFL', 'Epic', '{"season": "2023", "series": "Rare Set", "play_type": "Rushing TD"}'),
(2010, 'Dak Prescott', 'Cowboys', 'QB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Touchdown Pass"}'),
(2011, 'Russell Wilson', 'Broncos', 'QB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Deep Pass"}'),
(2012, 'Stefon Diggs', 'Bills', 'WR', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Touchdown Catch"}'),
(2013, 'Tyreek Hill', 'Dolphins', 'WR', 'NFL', 'Epic', '{"season": "2023", "series": "Rare Set", "play_type": "Long Reception"}'),
(2014, 'Christian McCaffrey', '49ers', 'RB', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Touchdown Run"}'),
(2015, 'Nick Chubb', 'Browns', 'RB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Long Run"}'),
(2016, 'Myles Garrett', 'Browns', 'DE', 'NFL', 'Epic', '{"season": "2023", "series": "Base Set", "play_type": "Strip Sack"}'),
(2017, 'Micah Parsons', 'Cowboys', 'LB', 'NFL', 'Rare', '{"season": "2023", "series": "Base Set", "play_type": "Interception"}'),
(2018, 'Travis Kelce', 'Chiefs', 'TE', 'NFL', 'Epic', '{"season": "2023", "series": "Rare Set", "play_type": "Touchdown Catch"}');

-- Insert multiple contests for different scenarios
INSERT INTO contests (week_id, start_time, end_time, status, entry_fee, prize_pool, max_participants, contest_type) VALUES
-- Free contests
(1, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'active', 0, 0, 100, 'free'),
(4, NOW() + INTERVAL '20 days', NOW() + INTERVAL '27 days', 'upcoming', 0, 0, 50, 'free'),

-- Paid contests
(2, NOW() + INTERVAL '5 days', NOW() + INTERVAL '12 days', 'upcoming', 5.0, 280.0, 100, 'paid'),
(3, NOW() + INTERVAL '12 days', NOW() + INTERVAL '19 days', 'upcoming', 10.0, 560.0, 80, 'paid'),
(5, NOW() + INTERVAL '27 days', NOW() + INTERVAL '34 days', 'upcoming', 25.0, 1400.0, 100, 'paid'),

-- Premium contests
(6, NOW() + INTERVAL '34 days', NOW() + INTERVAL '41 days', 'upcoming', 50.0, 2800.0, 60, 'premium'),

-- Sponsored contests
(7, NOW() + INTERVAL '41 days', NOW() + INTERVAL '48 days', 'upcoming', 15.0, 2100.0, 150, 'sponsored');

-- Insert sample lineups for active contest
INSERT INTO lineups (user_id, week_id, nft_ids, total_points, locked) VALUES
((SELECT id FROM users WHERE wallet_address = '0x1234567890123456789012345678901234567890'), 1, ARRAY[1001, 1002, 1003, 2001, 2002], 185, false),
((SELECT id FROM users WHERE wallet_address = '0x2345678901234567890123456789012345678901'), 1, ARRAY[1004, 1005, 1006, 2003, 2004], 162, false),
((SELECT id FROM users WHERE wallet_address = '0x3456789012345678901234567890123456789012'), 1, ARRAY[1007, 1008, 1009, 2005, 2006], 198, false),
((SELECT id FROM users WHERE wallet_address = '0x4567890123456789012345678901234567890123'), 1, ARRAY[1010, 1011, 1012, 2007, 2008], 143, false),
((SELECT id FROM users WHERE wallet_address = '0x5678901234567890123456789012345678901234'), 1, ARRAY[1013, 1014, 1015, 2009, 2010], 221, false);

-- Insert comprehensive player stats for multiple days
INSERT INTO player_stats (player_name, game_date, sport, stats, fantasy_points) VALUES
-- NBA stats for multiple days
('LeBron James', CURRENT_DATE - INTERVAL '2 days', 'NBA', '{"points": 31, "rebounds": 9, "assists": 8, "steals": 1, "blocks": 2}', 51.0),
('LeBron James', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 28, "rebounds": 8, "assists": 7, "steals": 2, "blocks": 1}', 46.0),
('Stephen Curry', CURRENT_DATE - INTERVAL '2 days', 'NBA', '{"points": 35, "rebounds": 5, "assists": 7, "steals": 2, "blocks": 0}', 49.0),
('Stephen Curry', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 32, "rebounds": 4, "assists": 6, "steals": 1, "blocks": 0}', 43.0),
('Giannis Antetokounmpo', CURRENT_DATE - INTERVAL '2 days', 'NBA', '{"points": 38, "rebounds": 14, "assists": 6, "steals": 2, "blocks": 3}', 63.0),
('Giannis Antetokounmpo', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 35, "rebounds": 12, "assists": 5, "steals": 1, "blocks": 2}', 55.0),
('Kevin Durant', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 29, "rebounds": 7, "assists": 4, "steals": 1, "blocks": 1}', 42.0),
('Kawhi Leonard', CURRENT_DATE - INTERVAL '1 day', 'NBA', '{"points": 26, "rebounds": 6, "assists": 3, "steals": 2, "blocks": 1}', 38.0),

-- NFL stats for multiple days
('Patrick Mahomes', CURRENT_DATE - INTERVAL '2 days', 'NFL', '{"passing_yards": 298, "rushing_yards": 22, "touchdowns": 2, "interceptions": 1}', 27.0),
('Patrick Mahomes', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"passing_yards": 325, "rushing_yards": 15, "touchdowns": 3, "interceptions": 0}', 32.0),
('Josh Allen', CURRENT_DATE - INTERVAL '2 days', 'NFL', '{"passing_yards": 312, "rushing_yards": 38, "touchdowns": 3, "interceptions": 0}', 31.2),
('Josh Allen', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"passing_yards": 280, "rushing_yards": 45, "touchdowns": 2, "interceptions": 1}', 26.5),
('Justin Jefferson', CURRENT_DATE - INTERVAL '2 days', 'NFL', '{"receiving_yards": 145, "receptions": 9, "touchdowns": 2, "targets": 13}', 32.5),
('Justin Jefferson', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"receiving_yards": 120, "receptions": 8, "touchdowns": 1, "targets": 12}', 24.0),
('Lamar Jackson', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"passing_yards": 245, "rushing_yards": 85, "touchdowns": 3, "interceptions": 0}', 32.0),
('Christian McCaffrey', CURRENT_DATE - INTERVAL '1 day', 'NFL', '{"rushing_yards": 142, "receiving_yards": 45, "carries": 24, "receptions": 4, "touchdowns": 2}', 30.7);

-- Insert diverse booster inventory for users
INSERT INTO boosters (owner_address, booster_type, effect_type, effect_value, status, activated_at, expires_at) VALUES
-- Active boosters
('0x1234567890123456789012345678901234567890', 'disney_energy', 'score_multiplier', 1.05, 'active', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '166 hours'),
('0x3456789012345678901234567890123456789012', 'shotcaller_multiplier', 'score_multiplier', 1.10, 'active', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days'),
('0x5678901234567890123456789012345678901234', 'disney_luck', 'random_bonus', 10.0, 'active', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '165 hours'),

-- Available boosters
('0x1234567890123456789012345678901234567890', 'disney_luck', 'random_bonus', 10.0, 'available', NULL, NULL),
('0x1234567890123456789012345678901234567890', 'shotcaller_power', 'extra_points', 5.0, 'available', NULL, NULL),
('0x2345678901234567890123456789012345678901', 'disney_energy', 'score_multiplier', 1.05, 'available', NULL, NULL),
('0x2345678901234567890123456789012345678901', 'shotcaller_multiplier', 'score_multiplier', 1.10, 'available', NULL, NULL),
('0x3456789012345678901234567890123456789012', 'disney_luck', 'random_bonus', 10.0, 'available', NULL, NULL),
('0x4567890123456789012345678901234567890123', 'shotcaller_power', 'extra_points', 5.0, 'available', NULL, NULL),
('0x7890123456789012345678901234567890123456', 'disney_energy', 'score_multiplier', 1.05, 'available', NULL, NULL),
('0x7890123456789012345678901234567890123456', 'disney_luck', 'random_bonus', 10.0, 'available', NULL, NULL),

-- Expired boosters
('0x2345678901234567890123456789012345678901', 'disney_energy', 'score_multiplier', 1.05, 'expired', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
('0x4567890123456789012345678901234567890123', 'shotcaller_power', 'extra_points', 5.0, 'expired', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days');

-- Insert extensive marketplace listings
INSERT INTO marketplace_listings (seller_address, moment_id, price, status, created_at, sold_at, buyer_address) VALUES
-- Active listings
('0x1234567890123456789012345678901234567890', 1007, 25.0, 'active', NOW() - INTERVAL '2 days', NULL, NULL),
('0x2345678901234567890123456789012345678901', 1008, 15.0, 'active', NOW() - INTERVAL '1 day', NULL, NULL),
('0x3456789012345678901234567890123456789012', 2007, 30.0, 'active', NOW() - INTERVAL '3 hours', NULL, NULL),
('0x4567890123456789012345678901234567890123', 2008, 20.0, 'active', NOW() - INTERVAL '1 hour', NULL, NULL),
('0x5678901234567890123456789012345678901234', 1011, 35.0, 'active', NOW() - INTERVAL '4 days', NULL, NULL),
('0x6789012345678901234567890123456789012345', 1012, 18.0, 'active', NOW() - INTERVAL '6 hours', NULL, NULL),
('0x7890123456789012345678901234567890123456', 2011, 28.0, 'active', NOW() - INTERVAL '2 hours', NULL, NULL),
('0x8901234567890123456789012345678901234567', 2012, 22.0, 'active', NOW() - INTERVAL '5 hours', NULL, NULL),

-- Sold listings
('0x2345678901234567890123456789012345678901', 1009, 40.0, 'sold', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', '0x1234567890123456789012345678901234567890'),
('0x3456789012345678901234567890123456789012', 2009, 45.0, 'sold', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days', '0x5678901234567890123456789012345678901234'),
('0x4567890123456789012345678901234567890123', 1010, 32.0, 'sold', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days', '0x7890123456789012345678901234567890123456'),

-- Cancelled listings
('0x5678901234567890123456789012345678901234', 1013, 50.0, 'cancelled', NOW() - INTERVAL '8 days', NULL, NULL),
('0x6789012345678901234567890123456789012345', 2013, 38.0, 'cancelled', NOW() - INTERVAL '9 days', NULL, NULL);

-- Insert comprehensive treasury transactions
INSERT INTO treasury_transactions (transaction_hash, transaction_type, amount, fee_amount, reward_pool_amount, treasury_amount, user_address, created_at) VALUES
-- Tournament entries
('0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz567', 'tournament_entry', 10.0, 0.0, 7.0, 3.0, '0x1234567890123456789012345678901234567890', NOW() - INTERVAL '3 days'),
('0xbcd234efg567hij890klm123nop456qrs789tuv012wxy345zab678', 'tournament_entry', 10.0, 0.0, 7.0, 3.0, '0x2345678901234567890123456789012345678901', NOW() - INTERVAL '3 days'),
('0xcde345fgh678ijk901lmn234opq567rst890uvw123xyz456abc789', 'tournament_entry', 10.0, 0.0, 7.0, 3.0, '0x3456789012345678901234567890123456789012', NOW() - INTERVAL '2 days'),
('0xdef456ghi789jkl012mno345pqr678stu901vwx234yz567abc123', 'tournament_entry', 5.0, 0.0, 3.5, 1.5, '0x4567890123456789012345678901234567890123', NOW() - INTERVAL '2 days'),
('0xefg567hij890klm123nop456qrs789tuv012wxy345zab678cde234', 'tournament_entry', 5.0, 0.0, 3.5, 1.5, '0x5678901234567890123456789012345678901234', NOW() - INTERVAL '1 day'),

-- Marketplace sales
('0xfgh678ijk901lmn234opq567rst890uvw123xyz456abc789def345', 'marketplace_sale', 40.0, 2.0, 1.4, 0.6, '0x2345678901234567890123456789012345678901', NOW() - INTERVAL '3 days'),
('0xghi789jkl012mno345pqr678stu901vwx234yz567abc123def456', 'marketplace_sale', 45.0, 2.25, 1.575, 0.675, '0x3456789012345678901234567890123456789012', NOW() - INTERVAL '4 days'),
('0xhij890klm123nop456qrs789tuv012wxy345zab678cde234efg567', 'marketplace_sale', 32.0, 1.6, 1.12, 0.48, '0x4567890123456789012345678901234567890123', NOW() - INTERVAL '2 days'),

-- Booster purchases
('0xijk901lmn234opq567rst890uvw123xyz456abc789def345fgh678', 'booster_purchase', 5.0, 0.25, 3.5, 1.5, '0x1234567890123456789012345678901234567890', NOW() - INTERVAL '2 hours'),
('0xjkl012mno345pqr678stu901vwx234yz567abc123def456ghi789', 'booster_purchase', 8.0, 0.4, 5.6, 2.4, '0x3456789012345678901234567890123456789012', NOW() - INTERVAL '1 day'),
('0xklm123nop456qrs789tuv012wxy345zab678cde234efg567hij890', 'booster_purchase', 12.0, 0.6, 8.4, 3.6, '0x5678901234567890123456789012345678901234', NOW() - INTERVAL '3 hours'),
('0xlmn234opq567rst890uvw123xyz456abc789def345fgh678ijk901', 'booster_purchase', 3.0, 0.15, 2.1, 0.9, '0x7890123456789012345678901234567890123456', NOW() - INTERVAL '5 hours'),

-- Season pass purchases
('0xmno345pqr678stu901vwx234yz567abc123def456ghi789jkl012', 'season_pass', 50.0, 0.0, 35.0, 15.0, '0x1234567890123456789012345678901234567890', NOW() - INTERVAL '10 days'),
('0xnop456qrs789tuv012wxy345zab678cde234efg567hij890klm123', 'season_pass', 50.0, 0.0, 35.0, 15.0, '0x2345678901234567890123456789012345678901', NOW() - INTERVAL '15 days'),
('0xopq567rst890uvw123xyz456abc789def345fgh678ijk901lmn234', 'season_pass', 15.0, 0.0, 10.5, 4.5, '0x8901234567890123456789012345678901234567', NOW() - INTERVAL '5 days'),

-- Reward distributions (from previous contests)
('0xpqr678stu901vwx234yz567abc123def456ghi789jkl012mno345', 'reward_distribution', 87.5, 0.0, -87.5, 0.0, '0x5678901234567890123456789012345678901234', NOW() - INTERVAL '7 days'),
('0xqrs789tuv012wxy345zab678cde234efg567hij890klm123nop456', 'reward_distribution', 52.5, 0.0, -52.5, 0.0, '0x3456789012345678901234567890123456789012', NOW() - INTERVAL '7 days'),
('0xrst890uvw123xyz456abc789def345fgh678ijk901lmn234opq567', 'reward_distribution', 35.0, 0.0, -35.0, 0.0, '0x1234567890123456789012345678901234567890', NOW() - INTERVAL '7 days');

-- Insert premium access records
INSERT INTO premium_access (user_address, access_type, expires_at, flow_amount, purchased_at, status) VALUES
-- Active premium access
('0x1234567890123456789012345678901234567890', 'season_pass', NOW() + INTERVAL '80 days', 50.0, NOW() - INTERVAL '10 days', 'active'),
('0x2345678901234567890123456789012345678901', 'season_pass', NOW() + INTERVAL '75 days', 50.0, NOW() - INTERVAL '15 days', 'active'),
('0x8901234567890123456789012345678901234567', 'monthly_premium', NOW() + INTERVAL '25 days', 15.0, NOW() - INTERVAL '5 days', 'active'),

-- Expired premium access
('0x4567890123456789012345678901234567890123', 'monthly_premium', NOW() - INTERVAL '5 days', 15.0, NOW() - INTERVAL '35 days', 'expired'),
('0x6789012345678901234567890123456789012345', 'season_pass', NOW() - INTERVAL '10 days', 50.0, NOW() - INTERVAL '100 days', 'expired');

-- Update contest participant counts and prize pools based on entries
UPDATE contests SET 
    total_participants = 5,
    prize_pool = 35.0
WHERE week_id = 1;

UPDATE contests SET 
    total_participants = 2,
    prize_pool = 7.0
WHERE week_id = 2;