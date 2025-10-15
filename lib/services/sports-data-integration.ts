import { SportsDataService } from './sports-data-service';
import { NBAStatsProvider } from './nba-stats-provider';
import { NFLStatsProvider } from './nfl-stats-provider';
import { PlayerStatsCache } from './player-stats-cache';
import { FantasyScoringEngine } from './fantasy-scoring-engine';
import { DataSyncService } from './data-sync-service';
import { PlayerStats } from '@/lib/types/player-stats';

export class SportsDataIntegration {
  private sportsDataService: SportsDataService;
  private cache: PlayerStatsCache;
  private scoringEngine: FantasyScoringEngine;
  private syncService: DataSyncService;
  private initialized: boolean = false;

  constructor() {
    // Initialize providers
    const nbaProvider = new NBAStatsProvider();
    const nflProvider = new NFLStatsProvider();
    
    // Initialize core services
    this.sportsDataService = new SportsDataService(nbaProvider, nflProvider);
    this.cache = new PlayerStatsCache();
    this.scoringEngine = new FantasyScoringEngine();
    this.syncService = new DataSyncService(
      this.sportsDataService,
      this.cache,
      this.scoringEngine
    );
  }

  /**
   * Initialize the sports data integration system
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Sports Data Integration...');

      // Validate API connections
      const connections = await this.sportsDataService.validateConnections();
      
      if (!connections.nba) {
        console.warn('NBA API connection failed - some features may be limited');
      }
      
      if (!connections.nfl) {
        console.warn('NFL API connection failed - some features may be limited');
      }

      // Validate scoring rules
      const nbaRulesValid = this.scoringEngine.validateScoringRules('NBA');
      const nflRulesValid = this.scoringEngine.validateScoringRules('NFL');

      if (!nbaRulesValid || !nflRulesValid) {
        throw new Error('Invalid scoring rules configuration');
      }

      // Schedule automatic sync jobs
      this.syncService.scheduleAutomaticSync();

      this.initialized = true;
      console.log('Sports Data Integration initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Sports Data Integration:', error);
      return false;
    }
  }

  /**
   * Get player stats with caching
   */
  async getPlayerStats(playerId: string, sport: 'NBA' | 'NFL', date: Date = new Date()): Promise<PlayerStats | null> {
    this.ensureInitialized();
    return this.syncService.syncPlayerStats(playerId, sport, date);
  }

  /**
   * Get daily stats for all players
   */
  async getDailyStats(sport: 'NBA' | 'NFL', date: Date = new Date()): Promise<PlayerStats[]> {
    this.ensureInitialized();
    
    // Check cache first
    const cachedStats = this.cache.getDailyStats(sport, date);
    if (cachedStats.length > 0) {
      return cachedStats;
    }

    // Sync fresh data
    const syncResult = await this.syncService.syncDailyStats(sport, date);
    if (syncResult.success) {
      return this.cache.getDailyStats(sport, date);
    }

    return [];
  }

  /**
   * Calculate lineup scores
   */
  async calculateLineupScores(lineups: Array<{ id: string; playerIds: string[] }>, date: Date = new Date()) {
    this.ensureInitialized();

    const results = [];

    for (const lineup of lineups) {
      const playerStats: PlayerStats[] = [];

      // Fetch stats for each player
      for (const playerId of lineup.playerIds) {
        const sport = this.determineSportFromPlayerId(playerId);
        const stats = await this.getPlayerStats(playerId, sport, date);
        if (stats) {
          playerStats.push(stats);
        }
      }

      // Calculate lineup score
      const lineupScore = this.scoringEngine.calculateLineupScore(lineup.id, playerStats);
      results.push(lineupScore);
    }

    return results;
  }

  /**
   * Force sync for specific date
   */
  async forceSyncDate(sport: 'NBA' | 'NFL', date: Date) {
    this.ensureInitialized();
    
    // Clear cache for this date
    this.cache.clear();
    
    // Force fresh sync
    return this.syncService.syncDailyStats(sport, date);
  }

  /**
   * Get sync job status
   */
  getActiveSyncJobs() {
    return this.syncService.getActiveJobs();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Shutdown the integration system
   */
  shutdown(): void {
    this.cache.destroy();
    console.log('Sports Data Integration shutdown complete');
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Sports Data Integration not initialized. Call initialize() first.');
    }
  }

  private determineSportFromPlayerId(playerId: string): 'NBA' | 'NFL' {
    // This would determine sport based on player ID format or database lookup
    // For now, assume NBA if no clear indicator
    if (playerId.includes('nfl') || playerId.startsWith('nfl_')) {
      return 'NFL';
    }
    return 'NBA';
  }
}

// Export singleton instance
export const sportsDataIntegration = new SportsDataIntegration();