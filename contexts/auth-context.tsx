"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fcl, isDapperWallet, isFlowWallet, getWalletServiceInfo } from '@/lib/flow-config';
import { sessionStorage, validateFlowAddress } from '@/lib/session-storage';
import { verifyWalletAddress, verifyGameplayEligibility } from '@/lib/wallet-verification';
import { handleError, ErrorType } from '@/lib/utils/error-handling';

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

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      const user = convertCurrentUser(currentUser);
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
      
      // Save session when user logs in
      if (user.loggedIn && user.addr) {
        sessionStorage.saveSession(user.addr, user.services);
        checkEligibility(user.addr);
      } else {
        // Clear session when user logs out
        sessionStorage.clearSession();
        setIsEligible(false);
        setEligibilityReason(undefined);
        setCollections([]);
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
    };
  }, []);

  const login = async (): Promise<void> => {
    return handleError(
      async () => {
        setIsLoading(true);
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