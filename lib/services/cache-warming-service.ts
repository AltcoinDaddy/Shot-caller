/**
 * Cache Warming Service for Profile and NFT Data
 * Implements intelligent cache warming strategies for frequently accessed data
 */

import { intelligentCache } from './intelligent-cache-service';
import { SyncEventBus } from './sync-event-bus';

export interface WarmupStrategy {
  name: string;
  priority: number;
  condition: () => boolean;
  execute: () => Promise<void>;
  schedule?: {
    interval: number;
    immediate?: boolean;
  };
}

export interface WarmupConfig {
  enableAutoWarmup: boolean;
  warmupOnConnect: boolean;
  warmupOnFocus: boolean;
  maxConcurrentWarmups: number;
  warmupTimeout: number;
}

export class CacheWarmingService {
  private strategies: WarmupStrategy[] = [];
  private activeWarmups = new Set<string>();
  private config: WarmupConfig;
  private eventBus: SyncEventBus;
  private warmupIntervals = new Map<string, NodeJS.Timeout>();

  constructor(eventBus: SyncEventBus, config: Partial<WarmupConfig> = {}) {
    this.eventBus = eventBus;
    this.config = {
      enableAutoWarmup: true,
      warmupOnConnect: true,
      warmupOnFocus: true,
      maxConcurrentWarmups: 3,
      warmupTimeout: 30000,
      ...config
    };

    this.initializeStrategies();
    this.setupEventListeners();
  }

  /**
   * Register a new warmup strategy
   */
  registerStrategy(strategy: WarmupStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);

    // Schedule if configured
    if (strategy.schedule) {
      this.scheduleStrategy(strategy);
    }
  }

  /**
   * Execute warmup for specific data types
   */
  async warmupProfileData(address: string): Promise<void> {
    if (!this.canStartWarmup('profile')) return;

    this.activeWarmups.add('profile');
    
    try {
      const warmupData = [
        {
          key: `profile:${address}`,
          fetcher: () => this.fetchProfileData(address),
          tags: ['profile', 'user-data']
        },
        {
          key: `profile:stats:${address}`,
          fetcher: () => this.fetchProfileStats(address),
          tags: ['profile', 'stats']
        },
        {
          key: `profile:achievements:${address}`,
          fetcher: () => this.fetchAchievements(address),
          tags: ['profile', 'achievements']
        }
      ];

      await intelligentCache.warmupCache(warmupData);
      console.log(`Profile data warmed up for address: ${address}`);
    } catch (error) {
      console.error('Profile warmup failed:', error);
    } finally {
      this.activeWarmups.delete('profile');
    }
  }

  /**
   * Execute warmup for NFT collection data
   */
  async warmupNFTData(address: string): Promise<void> {
    if (!this.canStartWarmup('nft')) return;

    this.activeWarmups.add('nft');
    
    try {
      const warmupData = [
        {
          key: `nft:collection:${address}`,
          fetcher: () => this.fetchNFTCollection(address),
          tags: ['nft', 'collection']
        },
        {
          key: `nft:eligibility:${address}`,
          fetcher: () => this.fetchEligibilityData(address),
          tags: ['nft', 'eligibility']
        },
        {
          key: `nft:metadata:${address}`,
          fetcher: () => this.fetchNFTMetadata(address),
          tags: ['nft', 'metadata']
        }
      ];

      await intelligentCache.warmupCache(warmupData);
      console.log(`NFT data warmed up for address: ${address}`);
    } catch (error) {
      console.error('NFT warmup failed:', error);
    } finally {
      this.activeWarmups.delete('nft');
    }
  }

  /**
   * Execute warmup for frequently accessed game data
   */
  async warmupGameData(): Promise<void> {
    if (!this.canStartWarmup('game')) return;

    this.activeWarmups.add('game');
    
    try {
      const warmupData = [
        {
          key: 'leaderboard:current',
          fetcher: () => this.fetchCurrentLeaderboard(),
          tags: ['game', 'leaderboard']
        },
        {
          key: 'contests:available',
          fetcher: () => this.fetchAvailableContests(),
          tags: ['game', 'contests']
        },
        {
          key: 'scoring:rules',
          fetcher: () => this.fetchScoringRules(),
          tags: ['game', 'rules']
        }
      ];

      await intelligentCache.warmupCache(warmupData);
      console.log('Game data warmed up successfully');
    } catch (error) {
      console.error('Game data warmup failed:', error);
    } finally {
      this.activeWarmups.delete('game');
    }
  }

  /**
   * Execute all applicable warmup strategies
   */
  async executeWarmupStrategies(): Promise<void> {
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.condition() && !this.activeWarmups.has(strategy.name)
    );

    const concurrentStrategies = applicableStrategies
      .slice(0, this.config.maxConcurrentWarmups);

    const warmupPromises = concurrentStrategies.map(async (strategy) => {
      this.activeWarmups.add(strategy.name);
      
      try {
        await Promise.race([
          strategy.execute(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Warmup timeout')), this.config.warmupTimeout)
          )
        ]);
      } catch (error) {
        console.error(`Warmup strategy ${strategy.name} failed:`, error);
      } finally {
        this.activeWarmups.delete(strategy.name);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get warmup status and statistics
   */
  getWarmupStatus(): {
    activeWarmups: string[];
    totalStrategies: number;
    scheduledStrategies: number;
  } {
    return {
      activeWarmups: Array.from(this.activeWarmups),
      totalStrategies: this.strategies.length,
      scheduledStrategies: this.warmupIntervals.size
    };
  }

  /**
   * Stop all warmup activities
   */
  stopAllWarmups(): void {
    // Clear all intervals
    this.warmupIntervals.forEach(interval => clearInterval(interval));
    this.warmupIntervals.clear();
    
    // Clear active warmups
    this.activeWarmups.clear();
  }

  private initializeStrategies(): void {
    // Profile data warmup strategy
    this.registerStrategy({
      name: 'profile-warmup',
      priority: 1,
      condition: () => this.config.enableAutoWarmup && this.hasConnectedWallet(),
      execute: async () => {
        const address = this.getConnectedWalletAddress();
        if (address) {
          await this.warmupProfileData(address);
        }
      },
      schedule: {
        interval: 5 * 60 * 1000, // 5 minutes
        immediate: false
      }
    });

    // NFT collection warmup strategy
    this.registerStrategy({
      name: 'nft-warmup',
      priority: 2,
      condition: () => this.config.enableAutoWarmup && this.hasConnectedWallet(),
      execute: async () => {
        const address = this.getConnectedWalletAddress();
        if (address) {
          await this.warmupNFTData(address);
        }
      },
      schedule: {
        interval: 10 * 60 * 1000, // 10 minutes
        immediate: false
      }
    });

    // Game data warmup strategy
    this.registerStrategy({
      name: 'game-warmup',
      priority: 3,
      condition: () => this.config.enableAutoWarmup,
      execute: async () => {
        await this.warmupGameData();
      },
      schedule: {
        interval: 15 * 60 * 1000, // 15 minutes
        immediate: true
      }
    });
  }

  private setupEventListeners(): void {
    // Warmup on wallet connection
    this.eventBus.subscribe('wallet_connected', async (event) => {
      if (this.config.warmupOnConnect && event.data?.address) {
        await Promise.all([
          this.warmupProfileData(event.data.address),
          this.warmupNFTData(event.data.address)
        ]);
      }
    });

    // Warmup on app focus
    if (typeof window !== 'undefined' && this.config.warmupOnFocus) {
      window.addEventListener('focus', () => {
        this.executeWarmupStrategies();
      });
    }

    // Warmup on NFT collection changes
    this.eventBus.subscribe('nft_collection_updated', async (event) => {
      if (event.data?.address) {
        await this.warmupNFTData(event.data.address);
      }
    });
  }

  private scheduleStrategy(strategy: WarmupStrategy): void {
    if (!strategy.schedule) return;

    const { interval, immediate } = strategy.schedule;

    if (immediate) {
      // Execute immediately if condition is met
      if (strategy.condition()) {
        strategy.execute().catch(error => 
          console.error(`Immediate warmup failed for ${strategy.name}:`, error)
        );
      }
    }

    // Schedule recurring execution
    const intervalId = setInterval(() => {
      if (strategy.condition() && !this.activeWarmups.has(strategy.name)) {
        strategy.execute().catch(error => 
          console.error(`Scheduled warmup failed for ${strategy.name}:`, error)
        );
      }
    }, interval);

    this.warmupIntervals.set(strategy.name, intervalId);
  }

  private canStartWarmup(type: string): boolean {
    return (
      this.config.enableAutoWarmup &&
      !this.activeWarmups.has(type) &&
      this.activeWarmups.size < this.config.maxConcurrentWarmups
    );
  }

  private hasConnectedWallet(): boolean {
    // This would integrate with your auth context
    return typeof window !== 'undefined' && 
           localStorage.getItem('wallet_connected') === 'true';
  }

  private getConnectedWalletAddress(): string | null {
    // This would integrate with your auth context
    return typeof window !== 'undefined' ? 
           localStorage.getItem('wallet_address') : null;
  }

  // Mock data fetchers - these would integrate with your actual services
  private async fetchProfileData(address: string): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      address,
      username: `user_${address.slice(-6)}`,
      joinDate: new Date(),
      lastActive: new Date()
    };
  }

  private async fetchProfileStats(address: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      gamesPlayed: 42,
      totalScore: 1250,
      averageScore: 29.8,
      rank: 156
    };
  }

  private async fetchAchievements(address: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      { id: 1, name: 'First Win', earned: true },
      { id: 2, name: 'Top 100', earned: false }
    ];
  }

  private async fetchNFTCollection(address: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      totalNFTs: 15,
      nbaTopShot: 8,
      nflAllDay: 7,
      eligibleMoments: 12
    };
  }

  private async fetchEligibilityData(address: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      isEligible: true,
      eligibleCollections: ['NBA Top Shot', 'NFL All Day'],
      lastChecked: new Date()
    };
  }

  private async fetchNFTMetadata(address: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      collections: ['NBA Top Shot', 'NFL All Day'],
      rarities: ['Common', 'Rare', 'Legendary'],
      totalValue: 1500
    };
  }

  private async fetchCurrentLeaderboard(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      season: 'current',
      topPlayers: Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        address: `0x${Math.random().toString(16).slice(2, 10)}`,
        score: 1000 - i * 50
      }))
    };
  }

  private async fetchAvailableContests(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      { id: 1, name: 'Weekly NBA', entryFee: 10, prizePool: 1000 },
      { id: 2, name: 'NFL Sunday', entryFee: 15, prizePool: 1500 }
    ];
  }

  private async fetchScoringRules(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      points: 1,
      rebounds: 1.2,
      assists: 1.5,
      steals: 3,
      blocks: 3
    };
  }
}