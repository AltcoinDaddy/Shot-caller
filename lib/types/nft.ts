// NFT Data Models and TypeScript Interfaces

export interface NFTMoment {
  id: string;
  momentId: number;
  playerName: string;
  team: string;
  position: string;
  sport: 'NBA' | 'NFL';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  metadata: NFTMetadata;
  imageUrl?: string;
  videoUrl?: string;
  ownerAddress: string;
  collectionName: string;
  serialNumber?: number;
  totalSupply?: number;
  lastUpdated: Date;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  video?: string;
  attributes: NFTAttribute[];
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  youtubeUrl?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
  max_value?: number;
}

export interface NFTCollection {
  contractName: string;
  contractAddress: string;
  collectionName: string;
  description: string;
  externalUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  sport: 'NBA' | 'NFL';
  totalSupply?: number;
}

export interface NFTOwnership {
  address: string;
  moments: NFTMoment[];
  collections: NFTCollection[];
  totalCount: number;
  lastVerified: Date;
  isEligible: boolean;
  eligibilityReason?: string;
}

export interface FindLabsNFT {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  externalURL: string;
  storagePath: string;
  publicPath: string;
  privatePath: string;
  publicLinkedType: string;
  privateLinkedType: string;
  collectionName: string;
  collectionDescription: string;
  collectionSquareImage: string;
  collectionBannerImage: string;
  royalties: FindLabsRoyalty[];
  metadata: Record<string, any>;
}

export interface FindLabsRoyalty {
  address: string;
  cut: number;
  description: string;
}

export interface FindLabsResponse {
  account: string;
  items: FindLabsNFT[];
  collections: string[];
}

export interface NFTVerificationResult {
  isValid: boolean;
  owner?: string;
  metadata?: NFTMetadata;
  error?: string;
}

export interface NFTCacheEntry {
  data: NFTMoment | NFTOwnership;
  timestamp: number;
  expiresAt: number;
}

export interface NFTCache {
  moments: Map<string, NFTCacheEntry>;
  ownership: Map<string, NFTCacheEntry>;
  collections: Map<string, NFTCacheEntry>;
}

// Flow blockchain specific types
export interface FlowNFTCollection {
  contractName: string;
  contractAddress: string;
  publicPath: string;
  storagePath: string;
  publicType: string;
  privateType: string;
}

export interface FlowNFTMoment {
  id: number;
  uuid: number;
  playID: number;
  play: FlowPlay;
  setID: number;
  set: FlowSet;
  serialNumber: number;
  mintingDate: string;
}

export interface FlowPlay {
  id: number;
  classification: string;
  metadata: Record<string, string>;
}

export interface FlowSet {
  id: number;
  name: string;
  series: number;
  setPlaysInEdition: number[];
  retired: Record<number, boolean>;
  locked: boolean;
}

// NBA Top Shot specific types
export interface TopShotMoment extends FlowNFTMoment {
  play: TopShotPlay;
  set: TopShotSet;
}

export interface TopShotPlay extends FlowPlay {
  classification: 'Common' | 'Rare' | 'Legendary' | 'Ultimate';
  metadata: {
    PlayerFirstName: string;
    PlayerLastName: string;
    PlayerPosition: string;
    TeamAtMoment: string;
    TeamAtMomentNbaId: string;
    DateOfMoment: string;
    PlayCategory: string;
    PlayType: string;
    GameEventId: string;
  };
}

export interface TopShotSet extends FlowSet {
  name: string;
  series: number;
}

// NFL All Day specific types
export interface AllDayMoment extends FlowNFTMoment {
  play: AllDayPlay;
  set: AllDaySet;
}

export interface AllDayPlay extends FlowPlay {
  classification: 'Common' | 'Rare' | 'Elite' | 'Ultimate';
  metadata: {
    PlayerFirstName: string;
    PlayerLastName: string;
    PlayerPosition: string;
    TeamAtMoment: string;
    DateOfMoment: string;
    PlayCategory: string;
    PlayType: string;
  };
}

export interface AllDaySet extends FlowSet {
  name: string;
  series: number;
}

// Disney Pinnacle types (for booster integration)
export interface DisneyPinnacleNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: string;
  collection: string;
  attributes: NFTAttribute[];
  boosterType?: 'energy' | 'luck';
  boosterValue?: number;
}

// API response types
export interface NFTAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedNFTResponse<T = any> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Error types
export class NFTError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NFTError';
  }
}

export class NFTVerificationError extends NFTError {
  constructor(message: string, details?: any) {
    super(message, 'VERIFICATION_ERROR', details);
    this.name = 'NFTVerificationError';
  }
}

export class NFTCacheError extends NFTError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'NFTCacheError';
  }
}

export class FindLabsAPIError extends NFTError {
  constructor(message: string, details?: any) {
    super(message, 'FINDLABS_API_ERROR', details);
    this.name = 'FindLabsAPIError';
  }
}

// Utility types
export type NFTSport = 'NBA' | 'NFL';
export type NFTRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Ultimate' | 'Elite';
export type NFTCollectionType = 'TopShot' | 'AllDay' | 'DisneyPinnacle';
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage';

// Configuration types
export interface NFTServiceConfig {
  findLabsApiUrl: string;
  findLabsApiKey?: string;
  cacheStrategy: CacheStrategy;
  cacheTTL: number; // Time to live in milliseconds
  maxCacheSize: number;
  enableBatchRequests: boolean;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}