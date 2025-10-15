// Booster and Power-up System Types

export interface Booster {
  id: string;
  ownerAddress: string;
  boosterType: BoosterType;
  effectType: BoosterEffectType;
  effectValue: number;
  durationHours: number;
  purchasedAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  status: BoosterStatus;
  sourceType: BoosterSourceType;
  sourceId?: string; // NFT ID for Disney Pinnacle boosters
  flowCost?: number; // Cost in FLOW tokens for purchased boosters
}

export type BoosterType = 
  | 'disney_energy' 
  | 'disney_luck' 
  | 'shotcaller_power' 
  | 'shotcaller_multiplier'
  | 'premium_boost';

export type BoosterEffectType = 
  | 'score_multiplier' 
  | 'random_bonus' 
  | 'extra_points'
  | 'lineup_protection';

export type BoosterStatus = 
  | 'available' 
  | 'active' 
  | 'expired' 
  | 'used';

export type BoosterSourceType = 
  | 'disney_pinnacle_nft' 
  | 'marketplace_purchase' 
  | 'premium_reward'
  | 'tournament_reward';

export interface BoosterEffect {
  type: BoosterEffectType;
  value: number;
  description: string;
  duration?: number; // in hours
}

export interface BoosterInventory {
  address: string;
  boosters: Booster[];
  activeBoosters: Booster[];
  availableBoosters: Booster[];
  expiredBoosters: Booster[];
  totalCount: number;
  lastUpdated: Date;
}

export interface BoosterMarketplaceItem {
  id: string;
  name: string;
  description: string;
  boosterType: BoosterType;
  effectType: BoosterEffectType;
  effectValue: number;
  durationHours: number;
  flowPrice: number;
  imageUrl?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  maxPurchases?: number; // per user per week
  isAvailable: boolean;
}

export interface DisneyPinnacleBooster {
  nftId: string;
  name: string;
  description: string;
  image: string;
  rarity: string;
  collection: string;
  boosterType: 'energy' | 'luck';
  effectType: BoosterEffectType;
  effectValue: number;
  durationHours: number;
  isActivated: boolean;
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface BoosterActivationRequest {
  boosterId: string;
  lineupId: string;
  userAddress: string;
}

export interface BoosterActivationResult {
  success: boolean;
  booster?: Booster;
  error?: string;
  expiresAt?: Date;
}

export interface BoosterPurchaseRequest {
  marketplaceItemId: string;
  userAddress: string;
  flowAmount: number;
}

export interface BoosterPurchaseResult {
  success: boolean;
  booster?: Booster;
  transactionHash?: string;
  error?: string;
}

// Predefined booster configurations
export const DISNEY_BOOSTER_CONFIGS: Record<string, BoosterEffect> = {
  'energy': {
    type: 'score_multiplier',
    value: 1.05, // +5% score multiplier
    description: '+5% score multiplier for one week',
    duration: 168 // 7 days in hours
  },
  'luck': {
    type: 'random_bonus',
    value: 25, // Random bonus 5-25 points
    description: 'Random bonus points (5-25) for one lineup',
    duration: 24 // 1 day in hours
  }
};

export const MARKETPLACE_BOOSTER_CONFIGS: BoosterMarketplaceItem[] = [
  {
    id: 'energy_boost',
    name: 'Energy Boost',
    description: '+5% score multiplier for one week',
    boosterType: 'shotcaller_power',
    effectType: 'score_multiplier',
    effectValue: 1.05,
    durationHours: 168,
    flowPrice: 2.5,
    rarity: 'Common',
    maxPurchases: 3,
    isAvailable: true
  },
  {
    id: 'luck_charm',
    name: 'Luck Charm',
    description: 'Random bonus points (5-25) for one lineup',
    boosterType: 'shotcaller_power',
    effectType: 'random_bonus',
    effectValue: 25,
    durationHours: 24,
    flowPrice: 1.8,
    rarity: 'Common',
    maxPurchases: 5,
    isAvailable: true
  },
  {
    id: 'power_surge',
    name: 'Power Surge',
    description: '+10% score multiplier for premium users',
    boosterType: 'premium_boost',
    effectType: 'score_multiplier',
    effectValue: 1.10,
    durationHours: 168,
    flowPrice: 4.0,
    rarity: 'Rare',
    maxPurchases: 2,
    isAvailable: true
  },
  {
    id: 'lineup_shield',
    name: 'Lineup Shield',
    description: 'Protects lineup from one bad performance',
    boosterType: 'shotcaller_multiplier',
    effectType: 'lineup_protection',
    effectValue: 1,
    durationHours: 168,
    flowPrice: 3.5,
    rarity: 'Epic',
    maxPurchases: 1,
    isAvailable: true
  }
];

// API Response Types
export interface BoosterAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Error Types
export class BoosterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BoosterError';
  }
}

export class BoosterActivationError extends BoosterError {
  constructor(message: string, details?: any) {
    super(message, 'ACTIVATION_ERROR', details);
    this.name = 'BoosterActivationError';
  }
}

export class BoosterPurchaseError extends BoosterError {
  constructor(message: string, details?: any) {
    super(message, 'PURCHASE_ERROR', details);
    this.name = 'BoosterPurchaseError';
  }
}

export class DisneyNFTError extends BoosterError {
  constructor(message: string, details?: any) {
    super(message, 'DISNEY_NFT_ERROR', details);
    this.name = 'DisneyNFTError';
  }
}