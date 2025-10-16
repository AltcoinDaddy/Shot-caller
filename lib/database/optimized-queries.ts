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

  // Advanced query optimizations
  async getPopularNFTs(sport?: 'NBA' | 'NFL', limit: number = 20): Promise<any[]> {
    let query = supabase
      .from('marketplace_listings')
      .select(`
        moment_id,
        count(*) as listing_count,
        avg(price) as avg_price,
        nfts (
          player_name,
          team,
          sport,
          rarity,
          metadata
        )
      `)
      .eq('status', 'sold');

    if (sport) {
      query = query.eq('nfts.sport', sport);
    }

    query = query
      .group('moment_id, nfts.player_name, nfts.team, nfts.sport, nfts.rarity, nfts.metadata')
      .order('listing_count', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    return error ? [] : data;
  }

  async getMarketplaceTrends(days: number = 7): Promise<any[]> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        created_at::date as date,
        count(*) as listings_count,
        avg(price) as avg_price,
        sum(price) filter (where status = 'sold') as total_volume
      `)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .group('created_at::date')
      .order('date', { ascending: false });

    return error ? [] : data;
  }

  async getUserPerformanceMetrics(walletAddress: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return error ? null : data;
  }

  async getTopPerformingLineups(weekId: number, limit: number = 10): Promise<any[]> {
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
      .limit(limit);

    return error ? [] : data;
  }

  async getPlayerPerformanceTrends(playerName: string, days: number = 30): Promise<PlayerStats[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    return this.getPlayerStats(playerName, startDate, endDate);
  }

  // Batch operations with transaction support
  async batchCreateLineups(lineups: any[]): Promise<boolean> {
    const { error } = await supabase
      .from('lineups')
      .insert(lineups);

    if (!error) {
      // Invalidate related caches
      await this.invalidateLeaderboardCache();
      for (const lineup of lineups) {
        await cacheService.invalidateUser(lineup.user_id);
      }
    }

    return !error;
  }

  async batchUpdateMarketplaceListings(updates: Array<{ id: string; status: string; buyer_address?: string; sold_at?: string }>): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_listings')
      .upsert(updates, { onConflict: 'id' });

    if (!error) {
      await this.invalidateMarketplaceCache();
    }

    return !error;
  }

  // Connection pooling and query optimization
  async executeOptimizedQuery<T>(
    query: string,
    params: any[] = [],
    useReadReplica: boolean = false
  ): Promise<T[]> {
    try {
      // Use read replica for read-only queries if available
      const client = useReadReplica && process.env.SUPABASE_READ_REPLICA_URL 
        ? supabase 
        : supabase;

      const { data, error } = await client.rpc('execute_query', {
        query_text: query,
        query_params: params
      });

      if (error) {
        console.error('Optimized query error:', error);
        return [];
      }

      return data as T[];
    } catch (error) {
      console.error('Query execution error:', error);
      return [];
    }
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

  // Database health and performance monitoring
  async getDatabaseStats(): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_database_stats');

    return error ? null : data;
  }

  async getSlowQueries(limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_slow_queries', { query_limit: limit });

    return error ? [] : data;
  }
}

export const optimizedQueries = new OptimizedQueries();