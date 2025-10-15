import { supabase } from '@/lib/supabase';
import { cacheService } from '@/lib/cache/cache-service';
import type { User, Contest, MarketplaceListing, NFTMoment, PlayerStats } from '@/lib/types';

export class OptimizedQueries {
  // User queries with caching
  async getUserByAddress(walletAddress: string): Promise<User | null> {
    // Try cache first
    const cached = await cacheService.getUser(walletAddress);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !data) return null;

    const user = data as User;
    await cacheService.setUser(walletAddress, user);
    return user;
  }

  async getUserStats(walletAddress: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return error ? null : data;
  }

  // Contest queries with caching
  async getActiveContests(): Promise<Contest[]> {
    const cached = await cacheService.getActiveContests();
    if (cached) return cached;

    const { data, error } = await supabase
      .from('active_contests')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) return [];

    const contests = data as Contest[];
    await cacheService.setActiveContests(contests);
    return contests;
  }

  async getContestById(contestId: string): Promise<Contest | null> {
    const cached = await cacheService.getContest(contestId);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (error || !data) return null;

    const contest = data as Contest;
    await cacheService.setContest(contestId, contest);
    return contest;
  }

  // Marketplace queries with caching and efficient filtering
  async getMarketplaceListings(
    filters?: {
      sport?: 'NBA' | 'NFL';
      rarity?: string;
      priceMin?: number;
      priceMax?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<MarketplaceListing[]> {
    const cacheKey = JSON.stringify(filters || {});
    const cached = await cacheService.getMarketplaceListings();
    
    let query = supabase
      .from('active_marketplace_listings')
      .select('*');

    // Apply filters using indexed columns
    if (filters?.sport && filters.sport !== 'all') {
      query = query.eq('sport', filters.sport);
    }
    if (filters?.rarity && filters.rarity !== 'all') {
      query = query.eq('rarity', filters.rarity);
    }
    if (filters?.priceMin) {
      query = query.gte('price', filters.priceMin);
    }
    if (filters?.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    // Use indexed ordering
    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
    }

    const { data, error } = await query;

    if (error) return [];

    const listings = data as MarketplaceListing[];
    if (!filters || Object.keys(filters).length === 0) {
      await cacheService.setMarketplaceListings(listings);
    }
    
    return listings;
  }

  async getUserMarketplaceListings(walletAddress: string): Promise<MarketplaceListing[]> {
    const cached = await cacheService.getUserMarketplaceListings(walletAddress);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        nfts (
          player_name,
          team,
          sport,
          rarity,
          metadata
        )
      `)
      .eq('seller_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) return [];

    const listings = data as MarketplaceListing[];
    await cacheService.setUserMarketplaceListings(walletAddress, listings);
    return listings;
  }

  // NFT queries with efficient ownership verification
  async getUserNFTs(walletAddress: string): Promise<NFTMoment[]> {
    const cached = await cacheService.getUserNFTs(walletAddress);
    if (cached) return cached;

    // This would typically query the blockchain or Find Labs API
    // For now, we'll use a placeholder that would be replaced with actual NFT verification
    const { data, error } = await supabase
      .from('nfts')
      .select('*')
      .in('moment_id', []) // This would be populated from blockchain query
      .order('last_updated', { ascending: false });

    if (error) return [];

    const nfts = data as NFTMoment[];
    await cacheService.setUserNFTs(walletAddress, nfts);
    return nfts;
  }

  // Player stats queries with date range optimization
  async getPlayerStats(
    playerName: string,
    startDate: string,
    endDate: string
  ): Promise<PlayerStats[]> {
    const cached = await cacheService.getPlayerStatsRange(playerName, startDate, endDate);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_name', playerName)
      .gte('game_date', startDate)
      .lte('game_date', endDate)
      .order('game_date', { ascending: false });

    if (error) return [];

    const stats = data as PlayerStats[];
    await cacheService.setPlayerStatsRange(playerName, startDate, endDate, stats);
    return stats;
  }

  async getTopPerformers(
    sport: 'NBA' | 'NFL',
    limit: number = 10
  ): Promise<PlayerStats[]> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('sport', sport)
      .order('fantasy_points', { ascending: false })
      .limit(limit);

    return error ? [] : (data as PlayerStats[]);
  }

  // Leaderboard queries with efficient ranking
  async getWeeklyLeaderboard(weekId: number): Promise<any[]> {
    const cached = await cacheService.getLeaderboard('weekly', weekId.toString());
    if (cached) return cached;

    const { data, error } = await supabase
      .from('lineups')
      .select(`
        *,
        users (
          wallet_address,
          username
        )
      `)
      .eq('week_id', weekId)
      .order('total_points', { ascending: false })
      .limit(100);

    if (error) return [];

    await cacheService.setLeaderboard('weekly', data, weekId.toString());
    return data;
  }

  async getSeasonLeaderboard(): Promise<any[]> {
    const cached = await cacheService.getLeaderboard('season');
    if (cached) return cached;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(100);

    if (error) return [];

    await cacheService.setLeaderboard('season', data);
    return data;
  }

  // Treasury queries for admin dashboard
  async getTreasuryTransactions(
    limit: number = 50,
    offset: number = 0,
    transactionType?: string
  ): Promise<any[]> {
    let query = supabase
      .from('treasury_transactions')
      .select('*');

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    return error ? [] : data;
  }

  async getTreasuryStatus(): Promise<any | null> {
    const cached = await cacheService.getTreasuryStatus();
    if (cached) return cached;

    // This would query the smart contract for actual treasury balances
    // For now, we'll aggregate from transactions
    const { data, error } = await supabase
      .rpc('get_treasury_status');

    if (error) return null;

    await cacheService.setTreasuryStatus(data);
    return data;
  }

  // Booster queries with expiration handling
  async getUserBoosters(walletAddress: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('boosters')
      .select('*')
      .eq('owner_address', walletAddress)
      .in('status', ['available', 'active'])
      .order('purchased_at', { ascending: false });

    return error ? [] : data;
  }

  async getActiveBoosters(walletAddress: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('boosters')
      .select('*')
      .eq('owner_address', walletAddress)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    return error ? [] : data;
  }

  // Premium access queries
  async getUserPremiumAccess(walletAddress: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('premium_access')
      .select('*')
      .eq('user_address', walletAddress)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    return error ? null : data;
  }

  // Batch operations for efficiency
  async batchUpdatePlayerStats(stats: PlayerStats[]): Promise<boolean> {
    const { error } = await supabase
      .from('player_stats')
      .upsert(stats, {
        onConflict: 'player_name,game_date',
        ignoreDuplicates: false
      });

    if (!error) {
      // Invalidate related caches
      for (const stat of stats) {
        const dateStr = stat.gameDate.toISOString().split('T')[0];
        await cacheService.del(`${stat.playerName}:${dateStr}`, {
          prefix: 'player_stats'
        });
      }
    }

    return !error;
  }

  async batchUpdateNFTMetadata(nfts: NFTMoment[]): Promise<boolean> {
    const { error } = await supabase
      .from('nfts')
      .upsert(nfts, {
        onConflict: 'moment_id',
        ignoreDuplicates: false
      });

    if (!error) {
      // Update cache
      for (const nft of nfts) {
        await cacheService.setNFT(nft.momentId.toString(), nft);
      }
    }

    return !error;
  }

  // Cache invalidation helpers
  async invalidateUserCache(walletAddress: string): Promise<void> {
    await cacheService.invalidateUser(walletAddress);
    await cacheService.invalidateUserNFTs(walletAddress);
  }

  async invalidateMarketplaceCache(): Promise<void> {
    await cacheService.invalidateMarketplace();
  }

  async invalidateLeaderboardCache(): Promise<void> {
    await cacheService.invalidateLeaderboards();
  }
}

export const optimizedQueries = new OptimizedQueries();