"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { fcl, isDapperWallet, isFlowWallet, getWalletServiceInfo } from '@/lib/flow-config';
import { sessionStorage, validateFlowAddress } from '@/lib/session-storage';
import { verifyWalletAddress, verifyGameplayEligibility } from '@/lib/wallet-verification';
import { handleError, ErrorType } from '@/lib/utils/error-handling';
import { ConcreteWalletProfileSyncManager, walletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import {
  SyncStatus,
  ProfileData,
  SyncEvent,
  SyncEventType,
  WalletType,
  ProfileStats,
  Achievement,
  NFTSyncResult,
  SyncResult
} from '@/lib/types/sync';

interface User {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean;
  services?: any[];
}

// Helper function to convert FCL CurrentUser to our User type
const convertCurrentUser = (currentUser: any): User => ({
  addr: currentUser.addr || null,
  cid: currentUser.cid || null,
  loggedIn: currentUser.loggedIn || false,
  services: currentUser.services || [],
});

interface AuthContextType {
  user: User;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isEligible: boolean;
  eligibilityReason?: string;
  collections: string[];
  refreshEligibility: () => Promise<void>;
  walletType: 'dapper' | 'flow' | 'other' | null;
  walletInfo: any;
  
  // New sync-related properties
  syncStatus: SyncStatus;
  profileData: ProfileData | null;
  nftCollection: any[];
  
  // New sync methods
  forceSyncProfile: () => Promise<void>;
  refreshNFTCollection: () => Promise<void>;
  getSyncHistory: () => SyncEvent[];
  
  // Event subscriptions
  onSyncStatusChange: (callback: (status: SyncStatus) => void) => () => void;
  onProfileDataChange: (callback: (data: ProfileData | null) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>({
    addr: null,
    cid: null,
    loggedIn: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string>();
  const [collections, setCollections] = useState<string[]>([]);
  const [walletType, setWalletType] = useState<'dapper' | 'flow' | 'other' | null>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  
  // New sync-related state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: null,
    nextSync: null,
    failureCount: 0
  });
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [nftCollection, setNftCollection] = useState<any[]>([]);
  
  // Sync manager instance and event handlers
  const syncManagerRef = useRef<ConcreteWalletProfileSyncManager | null>(null);
  const syncEventHandlersRef = useRef<Map<string, (status: SyncStatus) => void>>(new Map());
  const profileEventHandlersRef = useRef<Map<string, (data: ProfileData | null) => void>>(new Map());

  // Check gameplay eligibility when user changes
  const checkEligibility = async (address: string) => {
    if (!address || !validateFlowAddress(address)) {
      setIsEligible(false);
      setEligibilityReason('Invalid wallet address');
      setCollections([]);
      return;
    }

    try {
      const eligibility = await verifyGameplayEligibility(address);
      setIsEligible(eligibility.isEligible);
      setEligibilityReason(eligibility.reason);
      setCollections(eligibility.collections);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      setIsEligible(false);
      setEligibilityReason('Unable to verify eligibility');
      setCollections([]);
    }
  };

  const refreshEligibility = async () => {
    if (user.addr) {
      await checkEligibility(user.addr);
    }
  };

  // Initialize sync manager
  const initializeSyncManager = useCallback(() => {
    if (!syncManagerRef.current) {
      // Use the default singleton instance
      syncManagerRef.current = walletProfileSyncManager;

      // Subscribe to sync events
      syncManagerRef.current.subscribe(SyncEventType.PROFILE_SYNC_STARTED, (event) => {
        setSyncStatus(prev => ({ ...prev, isActive: true, currentOperation: 'profile_sync' }));
      });

      syncManagerRef.current.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (event) => {
        const result = event.data as SyncResult;
        setSyncStatus(prev => ({
          ...prev,
          isActive: false,
          lastSync: result.timestamp,
          currentOperation: undefined
        }));
      });

      syncManagerRef.current.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, (event) => {
        const result = event.data as NFTSyncResult;
        // Update NFT collection state based on sync result
        // This would typically fetch the updated collection data
        if (user.addr) {
          checkEligibility(user.addr);
        }
      });

      syncManagerRef.current.subscribe(SyncEventType.SYNC_ERROR, (event) => {
        setSyncStatus(prev => ({
          ...prev,
          isActive: false,
          failureCount: prev.failureCount + 1,
          currentOperation: undefined
        }));
      });
    }
  }, [user.addr]);

  // Sync-related methods
  const forceSyncProfile = useCallback(async () => {
    if (!user.addr || !syncManagerRef.current) {
      throw new Error('No wallet connected or sync manager not initialized');
    }

    try {
      const result = await syncManagerRef.current.syncWalletToProfile(user.addr, true);
      
      // Update profile data based on sync result
      if (result.success) {
        const newProfileData: ProfileData = {
          address: user.addr,
          username: user.addr,
          walletType: walletType === 'dapper' ? WalletType.DAPPER : 
                     walletType === 'flow' ? WalletType.FLOW : WalletType.OTHER,
          collections,
          stats: {
            totalNFTs: nftCollection.length,
            eligibleMoments: collections.length,
            weeklyScore: 0,
            seasonRank: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0
          } as ProfileStats,
          achievements: [] as Achievement[],
          lastUpdated: new Date()
        };
        
        setProfileData(newProfileData);
        
        // Notify profile data change handlers
        profileEventHandlersRef.current.forEach(handler => {
          try {
            handler(newProfileData);
          } catch (error) {
            console.error('Error in profile data change handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Force sync profile failed:', error);
      throw error;
    }
  }, [user.addr, walletType, collections, nftCollection.length]);

  const refreshNFTCollection = useCallback(async () => {
    if (!user.addr || !syncManagerRef.current) {
      throw new Error('No wallet connected or sync manager not initialized');
    }

    try {
      const result = await syncManagerRef.current.syncNFTCollection(user.addr);
      
      if (result.success) {
        // Refresh eligibility after NFT collection sync
        await checkEligibility(user.addr);
      }
    } catch (error) {
      console.error('Refresh NFT collection failed:', error);
      throw error;
    }
  }, [user.addr]);

  const getSyncHistory = useCallback((): SyncEvent[] => {
    // Return sync history from sync manager
    // This is a simplified implementation - actual history would be maintained by sync manager
    return [];
  }, []);

  // Event subscription methods
  const onSyncStatusChange = useCallback((callback: (status: SyncStatus) => void): (() => void) => {
    const id = Math.random().toString(36).substr(2, 9);
    syncEventHandlersRef.current.set(id, callback);
    
    return () => {
      syncEventHandlersRef.current.delete(id);
    };
  }, []);

  const onProfileDataChange = useCallback((callback: (data: ProfileData | null) => void): (() => void) => {
    const id = Math.random().toString(36).substr(2, 9);
    profileEventHandlersRef.current.set(id, callback);
    
    return () => {
      profileEventHandlersRef.current.delete(id);
    };
  }, []);

  useEffect(() => {
    // Initialize sync manager
    initializeSyncManager();

    // Subscribe to authentication state changes
    const unsubscribe = fcl.currentUser.subscribe(async (currentUser) => {
      const user = convertCurrentUser(currentUser);
      const previousUser = { ...user };
      setUser(user);
      
      // Determine wallet type and info
      if (user.loggedIn && user.services) {
        if (isDapperWallet(user.services)) {
          setWalletType('dapper');
          setWalletInfo(getWalletServiceInfo('0x82ec283f88a62e65'));
        } else if (isFlowWallet(user.services)) {
          setWalletType('flow');
          setWalletInfo(getWalletServiceInfo('0xead892083b3e2c6c'));
        } else {
          setWalletType('other');
          const connectedService = user.services.find((service: any) => 
            getWalletServiceInfo(service.id || service.f_vsn)
          );
          setWalletInfo(connectedService ? getWalletServiceInfo(connectedService.id || connectedService.f_vsn) : null);
        }
      } else {
        setWalletType(null);
        setWalletInfo(null);
      }
      
      // Handle wallet connection/disconnection events
      if (user.loggedIn && user.addr) {
        // Save session when user logs in
        sessionStorage.saveSession(user.addr, user.services);
        await checkEligibility(user.addr);
        
        // Trigger sync manager wallet connection event
        if (syncManagerRef.current && (!previousUser.loggedIn || previousUser.addr !== user.addr)) {
          try {
            await syncManagerRef.current.onWalletConnect(user.addr, user.services || []);
          } catch (error) {
            console.error('Sync manager wallet connect failed:', error);
          }
        }
      } else {
        // Clear session when user logs out
        sessionStorage.clearSession();
        setIsEligible(false);
        setEligibilityReason(undefined);
        setCollections([]);
        
        // Clear sync-related state
        setProfileData(null);
        setNftCollection([]);
        setSyncStatus({
          isActive: false,
          lastSync: null,
          nextSync: null,
          failureCount: 0
        });
        
        // Trigger sync manager wallet disconnection event
        if (syncManagerRef.current && previousUser.loggedIn) {
          try {
            await syncManagerRef.current.onWalletDisconnect();
          } catch (error) {
            console.error('Sync manager wallet disconnect failed:', error);
          }
        }
      }
    });
    
    // Check if user is already authenticated on mount
    const initializeAuth = async () => {
      try {
        // First check for existing session
        const savedSession = sessionStorage.getSession();
        if (savedSession) {
          // Verify the saved session is still valid
          const verification = await verifyWalletAddress(savedSession.address);
          if (verification.isValid) {
            // Session is valid, check current FCL state
            const currentUser = await fcl.currentUser.snapshot();
            if (currentUser.loggedIn) {
              setUser(currentUser);
              await checkEligibility(currentUser.addr);
            } else {
              // FCL state doesn't match saved session, clear it
              sessionStorage.clearSession();
            }
          } else {
            // Saved session is invalid, clear it
            sessionStorage.clearSession();
          }
        }
        
        // Get current FCL state regardless
        const currentUser = await fcl.currentUser.snapshot();
        const user = convertCurrentUser(currentUser);
        setUser(user);
        
        if (user.loggedIn && user.addr) {
          await checkEligibility(user.addr);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      unsubscribe();
      // Clean up sync manager
      if (syncManagerRef.current) {
        syncManagerRef.current = null;
      }
      syncEventHandlersRef.current.clear();
      profileEventHandlersRef.current.clear();
    };
  }, [initializeSyncManager]);

  const login = async (): Promise<void> => {
    return handleError(
      async () => {
        setIsLoading(true);
        
        // Initialize sync manager if not already done
        initializeSyncManager();
        
        await fcl.authenticate();
        
        // Wait for authentication to complete and get user info
        const currentUser = await fcl.currentUser.snapshot();
        if (currentUser.loggedIn && currentUser.addr) {
          // Verify the wallet address
          const verification = await verifyWalletAddress(currentUser.addr);
          if (!verification.isValid) {
            throw new Error(verification.error || 'Wallet verification failed');
          }
          
          // Save session and check eligibility
          sessionStorage.saveSession(currentUser.addr, currentUser.services);
          await checkEligibility(currentUser.addr);
          
          // Trigger sync manager wallet connection
          if (syncManagerRef.current) {
            try {
              await syncManagerRef.current.onWalletConnect(currentUser.addr, currentUser.services || []);
            } catch (error) {
              console.error('Sync manager initialization failed:', error);
              // Don't fail login if sync fails
            }
          }
        }
      },
      {
        errorType: ErrorType.WALLET_CONNECTION,
        showToast: false, // Let the wallet connector handle the toast
        fallbackFn: async () => {
          // Clear any partial session data on failure
          sessionStorage.clearSession();
          setIsLoading(false);
          throw new Error('Authentication failed');
        }
      }
    ).finally(() => {
      setIsLoading(false);
    });
  };

  const logout = async (): Promise<void> => {
    return handleError(
      async () => {
        setIsLoading(true);
        
        // Trigger sync manager wallet disconnection
        if (syncManagerRef.current) {
          try {
            await syncManagerRef.current.onWalletDisconnect();
          } catch (error) {
            console.error('Sync manager disconnect failed:', error);
            // Don't fail logout if sync cleanup fails
          }
        }
        
        await fcl.unauthenticate();
        
        // Clear session storage
        sessionStorage.clearSession();
        
        // Clear user data and eligibility
        setUser({
          addr: null,
          cid: null,
          loggedIn: false,
        });
        setIsEligible(false);
        setEligibilityReason(undefined);
        setCollections([]);
        setWalletType(null);
        setWalletInfo(null);
        
        // Clear sync-related state
        setProfileData(null);
        setNftCollection([]);
        setSyncStatus({
          isActive: false,
          lastSync: null,
          nextSync: null,
          failureCount: 0
        });
      },
      {
        errorType: ErrorType.AUTHENTICATION,
        showToast: false, // Let the wallet connector handle the toast
        fallbackFn: async () => {
          // Force clear local state even if FCL logout fails
          sessionStorage.clearSession();
          setUser({
            addr: null,
            cid: null,
            loggedIn: false,
          });
          setIsEligible(false);
          setEligibilityReason(undefined);
          setCollections([]);
          setWalletType(null);
          setWalletInfo(null);
          
          // Clear sync-related state
          setProfileData(null);
          setNftCollection([]);
          setSyncStatus({
            isActive: false,
            lastSync: null,
            nextSync: null,
            failureCount: 0
          });
        }
      }
    ).finally(() => {
      setIsLoading(false);
    });
  };

  const isAuthenticated = user.loggedIn && user.addr !== null;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isEligible,
    eligibilityReason,
    collections,
    refreshEligibility,
    walletType,
    walletInfo,
    
    // New sync-related properties
    syncStatus,
    profileData,
    nftCollection,
    
    // New sync methods
    forceSyncProfile,
    refreshNFTCollection,
    getSyncHistory,
    
    // Event subscriptions
    onSyncStatusChange,
    onProfileDataChange,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};