// React hooks for marketplace functionality

import { useState, useEffect, useCallback } from 'react';
import { 
  MarketplaceListing, 
  MarketplaceTransaction, 
  MarketplaceFilters, 
  MarketplaceSortOptions, 
  MarketplaceStats,
  PaginatedMarketplaceResponse 
} from '@/lib/types/marketplace';

interface UseMarketplaceListingsOptions {
  filters?: MarketplaceFilters;
  sort?: MarketplaceSortOptions;
  page?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMarketplaceListings(options: UseMarketplaceListingsOptions = {}) {
  const [listings, setListings] = useState<PaginatedMarketplaceResponse<MarketplaceListing> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    filters,
    sort = { sortBy: 'date', sortOrder: 'desc' },
    page = 1,
    limit = 20,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters?.sport && filters.sport !== 'all') params.append('sport', filters.sport);
      if (filters?.rarity && filters.rarity !== 'all') params.append('rarity', filters.rarity);
      if (filters?.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
      if (filters?.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
      if (filters?.team) params.append('team', filters.team);
      if (filters?.search) params.append('search', filters.search);

      // Add sorting
      params.append('sortBy', sort.sortBy);
      params.append('sortOrder', sort.sortOrder);

      // Add pagination
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/marketplace/listings?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch listings');
      }

      const data = await response.json();
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchListings, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchListings]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings
  };
}

export function useUserListings(userAddress: string | null, includeInactive: boolean = false) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserListings = useCallback(async () => {
    if (!userAddress) {
      setListings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: userAddress,
        includeInactive: includeInactive.toString()
      });

      const response = await fetch(`/api/marketplace/user-listings?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user listings');
      }

      const data = await response.json();
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userAddress, includeInactive]);

  useEffect(() => {
    fetchUserListings();
  }, [fetchUserListings]);

  return {
    listings,
    loading,
    error,
    refetch: fetchUserListings
  };
}

export function useMarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/stats');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch marketplace stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

export function useMarketplaceActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(async (
    sellerAddress: string,
    momentId: number,
    price: number,
    expirationDays?: number
  ): Promise<MarketplaceListing | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerAddress,
          momentId,
          price,
          expirationDays
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const listing = await response.json();
      return listing;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseNFT = useCallback(async (
    listingId: string,
    buyerAddress: string
  ): Promise<MarketplaceTransaction | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          buyerAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase NFT');
      }

      const transaction = await response.json();
      return transaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelListing = useCallback(async (
    listingId: string,
    sellerAddress: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          sellerAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel listing');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createListing,
    purchaseNFT,
    cancelListing,
    loading,
    error
  };
}