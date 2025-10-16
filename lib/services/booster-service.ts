// Booster and Power-up Management Service

import {
  Booster,
  BoosterInventory,
  BoosterMarketplaceItem,
  DisneyPinnacleBooster,
  BoosterActivationRequest,
  BoosterActivationResult,
  BoosterPurchaseRequest,
  BoosterPurchaseResult,
  BoosterAPIResponse,
  BoosterError,
  BoosterActivationError,
  BoosterPurchaseError,
  DisneyNFTError,
  DISNEY_BOOSTER_CONFIGS,
  MARKETPLACE_BOOSTER_CONFIGS,
  BoosterType,
  BoosterEffectType,
  BoosterStatus
} from '@/lib/types/booster';
import { DisneyPinnacleNFT } from '@/lib/types/nft';
import { nftOwnershipService } from './nft-ownership-service';

export class BoosterService {
  private boosters: Map<string, Booster> = new Map();
  private userInventories: Map<string, BoosterInventory> = new Map();

  /**
   * Get user's booster inventory
   */
  async getBoosterInventory(userAddress: string): Promise<BoosterAPIResponse<BoosterInventory>> {
    try {
      // Check cache first
      const cached = this.userInventories.get(userAddress);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        return {
          success: true,
          data: cached,
          timestamp: Date.now()
        };
      }

      // Load boosters from storage (in real app, this would be from database)
      const userBoosters = this.loadUserBoosters(userAddress);
      
      // Load Disney Pinnacle NFTs and convert to boosters
      const disneyBoosters = await this.loadDisneyPinnacleBoosters(userAddress);
      
      // Combine all boosters
      const allBoosters = [...userBoosters, ...disneyBoosters];
      
      // Update expiration status
      this.updateBoosterStatuses(allBoosters);
      
      const inventory: BoosterInventory = {
        address: userAddress,
        boosters: allBoosters,
        activeBoosters: allBoosters.filter(b => b.status === 'active'),
        availableBoosters: allBoosters.filter(b => b.status === 'available'),
        expiredBoosters: allBoosters.filter(b => b.status === 'expired'),
        totalCount: allBoosters.length,
        lastUpdated: new Date()
      };

      // Cache the inventory
      this.userInventories.set(userAddress, inventory);

      return {
        success: true,
        data: inventory,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load booster inventory',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Load Disney Pinnacle NFTs and convert to boosters
   */
  private async loadDisneyPinnacleBoosters(userAddress: string): Promise<Booster[]> {
    try {
      const response = await nftOwnershipService.getDisneyPinnacleNFTs(userAddress);
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map(nft => this.convertDisneyNFTToBooster(nft, userAddress));
    } catch (error) {
      console.warn('Failed to load Disney Pinnacle NFTs:', error);
      return [];
    }
  }

  /**
   * Convert Disney Pinnacle NFT to booster
   */
  private convertDisneyNFTToBooster(nft: DisneyPinnacleNFT, userAddress: string): Booster {
    const boosterType = nft.boosterType || 'energy';
    const config = DISNEY_BOOSTER_CONFIGS[boosterType];
    
    return {
      id: `disney_${nft.id}`,
      ownerAddress: userAddress,
      boosterType: `disney_${boosterType}` as BoosterType,
      effectType: config.type,
      effectValue: config.value,
      durationHours: config.duration || 168,
      purchasedAt: new Date(), // NFT mint date would be better
      status: 'available',
      sourceType: 'disney_pinnacle_nft',
      sourceId: nft.id
    };
  }

  /**
   * Load user's purchased boosters from storage
   */
  private loadUserBoosters(userAddress: string): Booster[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const stored = localStorage.getItem(`boosters_${userAddress}`);
      if (!stored) return [];

      const boosters = JSON.parse(stored) as Booster[];
      return boosters.map(b => ({
        ...b,
        purchasedAt: new Date(b.purchasedAt),
        activatedAt: b.activatedAt ? new Date(b.activatedAt) : undefined,
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined
      }));
    } catch (error) {
      console.warn('Failed to load user boosters:', error);
      return [];
    }
  }

  /**
   * Save user boosters to storage
   */
  private saveUserBoosters(userAddress: string, boosters: Booster[]): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const purchasedBoosters = boosters.filter(b => b.sourceType !== 'disney_pinnacle_nft');
      localStorage.setItem(`boosters_${userAddress}`, JSON.stringify(purchasedBoosters));
    } catch (error) {
      console.warn('Failed to save user boosters:', error);
    }
  }

  /**
   * Update booster statuses based on expiration
   */
  private updateBoosterStatuses(boosters: Booster[]): void {
    const now = new Date();
    
    boosters.forEach(booster => {
      if (booster.status === 'active' && booster.expiresAt && booster.expiresAt < now) {
        booster.status = 'expired';
      }
    });
  }

  /**
   * Get marketplace boosters
   */
  getMarketplaceBoosters(): BoosterAPIResponse<BoosterMarketplaceItem[]> {
    return {
      success: true,
      data: MARKETPLACE_BOOSTER_CONFIGS.filter(item => item.isAvailable),
      timestamp: Date.now()
    };
  }

  /**
   * Purchase booster from marketplace
   */
  async purchaseBooster(request: BoosterPurchaseRequest): Promise<BoosterPurchaseResult> {
    try {
      // Find marketplace item
      const marketplaceItem = MARKETPLACE_BOOSTER_CONFIGS.find(
        item => item.id === request.marketplaceItemId
      );

      if (!marketplaceItem) {
        throw new BoosterPurchaseError('Booster not found in marketplace');
      }

      if (!marketplaceItem.isAvailable) {
        throw new BoosterPurchaseError('Booster is not available for purchase');
      }

      if (request.flowAmount < marketplaceItem.flowPrice) {
        throw new BoosterPurchaseError('Insufficient FLOW tokens');
      }

      // Check purchase limits
      const userBoosters = this.loadUserBoosters(request.userAddress);
      const weeklyPurchases = this.getWeeklyPurchases(userBoosters, marketplaceItem.id);
      
      if (marketplaceItem.maxPurchases && weeklyPurchases >= marketplaceItem.maxPurchases) {
        throw new BoosterPurchaseError(`Maximum ${marketplaceItem.maxPurchases} purchases per week reached`);
      }

      // Create new booster
      const newBooster: Booster = {
        id: `purchased_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerAddress: request.userAddress,
        boosterType: marketplaceItem.boosterType,
        effectType: marketplaceItem.effectType,
        effectValue: marketplaceItem.effectValue,
        durationHours: marketplaceItem.durationHours,
        purchasedAt: new Date(),
        status: 'available',
        sourceType: 'marketplace_purchase',
        flowCost: marketplaceItem.flowPrice
      };

      // Add to user's boosters
      userBoosters.push(newBooster);
      this.saveUserBoosters(request.userAddress, userBoosters);

      // Invalidate cache
      this.userInventories.delete(request.userAddress);

      // In real implementation, this would process FLOW payment
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      return {
        success: true,
        booster: newBooster,
        transactionHash: mockTransactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  /**
   * Activate booster for a lineup
   */
  async activateBooster(request: BoosterActivationRequest): Promise<BoosterActivationResult> {
    try {
      const inventory = await this.getBoosterInventory(request.userAddress);
      
      if (!inventory.success || !inventory.data) {
        throw new BoosterActivationError('Failed to load booster inventory');
      }

      const booster = inventory.data.boosters.find(b => b.id === request.boosterId);
      
      if (!booster) {
        throw new BoosterActivationError('Booster not found');
      }

      if (booster.status !== 'available') {
        throw new BoosterActivationError(`Booster is ${booster.status} and cannot be activated`);
      }

      // Check if user already has an active booster of the same type
      const activeBoosterOfType = inventory.data.activeBoosters.find(
        b => b.effectType === booster.effectType
      );

      if (activeBoosterOfType) {
        throw new BoosterActivationError(
          `You already have an active ${booster.effectType} booster`
        );
      }

      // Activate the booster
      const now = new Date();
      const expiresAt = new Date(now.getTime() + booster.durationHours * 60 * 60 * 1000);

      booster.status = 'active';
      booster.activatedAt = now;
      booster.expiresAt = expiresAt;

      // Save updated boosters
      const allBoosters = inventory.data.boosters;
      const purchasedBoosters = allBoosters.filter(b => b.sourceType !== 'disney_pinnacle_nft');
      this.saveUserBoosters(request.userAddress, purchasedBoosters);

      // Invalidate cache
      this.userInventories.delete(request.userAddress);

      return {
        success: true,
        booster,
        expiresAt
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activation failed'
      };
    }
  }

  /**
   * Get active boosters for a user
   */
  async getActiveBoosters(userAddress: string): Promise<BoosterAPIResponse<Booster[]>> {
    const inventory = await this.getBoosterInventory(userAddress);
    
    if (!inventory.success || !inventory.data) {
      return {
        success: false,
        error: 'Failed to load booster inventory',
        timestamp: Date.now()
      };
    }

    return {
      success: true,
      data: inventory.data.activeBoosters,
      timestamp: Date.now()
    };
  }

  /**
   * Get booster effects for scoring calculation
   */
  async getBoosterEffectsForLineup(userAddress: string, lineupId: string) {
    const activeBoostersResponse = await this.getActiveBoosters(userAddress);
    
    if (!activeBoostersResponse.success || !activeBoostersResponse.data) {
      return [];
    }

    return activeBoostersResponse.data.map(booster => ({
      type: booster.effectType,
      value: booster.effectValue,
      description: this.getBoosterDescription(booster)
    }));
  }

  /**
   * Deactivate expired boosters
   */
  async deactivateExpiredBoosters(userAddress: string): Promise<void> {
    const inventory = await this.getBoosterInventory(userAddress);
    
    if (!inventory.success || !inventory.data) {
      return;
    }

    const now = new Date();
    let hasChanges = false;

    inventory.data.boosters.forEach(booster => {
      if (booster.status === 'active' && booster.expiresAt && booster.expiresAt < now) {
        booster.status = 'expired';
        hasChanges = true;
      }
    });

    if (hasChanges) {
      const purchasedBoosters = inventory.data.boosters.filter(
        b => b.sourceType !== 'disney_pinnacle_nft'
      );
      this.saveUserBoosters(userAddress, purchasedBoosters);
      this.userInventories.delete(userAddress);
    }
  }

  /**
   * Get Disney Pinnacle boosters for a user
   */
  async getDisneyPinnacleBoosters(userAddress: string): Promise<BoosterAPIResponse<DisneyPinnacleBooster[]>> {
    try {
      const response = await nftOwnershipService.getDisneyPinnacleNFTs(userAddress);
      
      if (!response.success || !response.data) {
        return {
          success: true,
          data: [],
          timestamp: Date.now()
        };
      }

      const disneyBoosters: DisneyPinnacleBooster[] = response.data.map(nft => {
        const boosterType = nft.boosterType || 'energy';
        const config = DISNEY_BOOSTER_CONFIGS[boosterType];
        
        return {
          nftId: nft.id,
          name: nft.name,
          description: nft.description,
          image: nft.image,
          rarity: nft.rarity,
          collection: nft.collection,
          boosterType,
          effectType: config.type,
          effectValue: config.value,
          durationHours: config.duration || 168,
          isActivated: false // Would check activation status
        };
      });

      return {
        success: true,
        data: disneyBoosters,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load Disney Pinnacle boosters',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Helper methods
   */
  private getWeeklyPurchases(boosters: Booster[], marketplaceItemId: string): number {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return boosters.filter(booster => 
      booster.sourceType === 'marketplace_purchase' &&
      booster.purchasedAt > oneWeekAgo &&
      booster.id.includes(marketplaceItemId)
    ).length;
  }

  private getBoosterDescription(booster: Booster): string {
    switch (booster.effectType) {
      case 'score_multiplier':
        const percentage = Math.round((booster.effectValue - 1) * 100);
        return `+${percentage}% score multiplier`;
      case 'random_bonus':
        return `Random bonus points (5-${booster.effectValue})`;
      case 'extra_points':
        return `+${booster.effectValue} bonus points`;
      case 'lineup_protection':
        return 'Protects lineup from one bad performance';
      default:
        return 'Unknown booster effect';
    }
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const cacheAge = Date.now() - lastUpdated.getTime();
    return cacheAge < 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Clear user's booster cache
   */
  clearUserCache(userAddress: string): void {
    this.userInventories.delete(userAddress);
  }

  /**
   * Get booster statistics
   */
  async getBoosterStats(userAddress: string): Promise<BoosterAPIResponse<any>> {
    const inventory = await this.getBoosterInventory(userAddress);
    
    if (!inventory.success || !inventory.data) {
      return {
        success: false,
        error: 'Failed to load booster inventory',
        timestamp: Date.now()
      };
    }

    const stats = {
      totalBoosters: inventory.data.totalCount,
      activeBoosters: inventory.data.activeBoosters.length,
      availableBoosters: inventory.data.availableBoosters.length,
      expiredBoosters: inventory.data.expiredBoosters.length,
      disneyBoosters: inventory.data.boosters.filter(b => b.sourceType === 'disney_pinnacle_nft').length,
      purchasedBoosters: inventory.data.boosters.filter(b => b.sourceType === 'marketplace_purchase').length,
      totalSpent: inventory.data.boosters
        .filter(b => b.flowCost)
        .reduce((sum, b) => sum + (b.flowCost || 0), 0)
    };

    return {
      success: true,
      data: stats,
      timestamp: Date.now()
    };
  }
}

// Default service instance
export const boosterService = new BoosterService();