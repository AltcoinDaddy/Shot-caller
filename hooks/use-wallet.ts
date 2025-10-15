import { useAuth } from '@/contexts/auth-context';
import { getFlowBalance } from '@/lib/wallet-verification';
import { useState, useEffect } from 'react';

interface WalletBalance {
  balance: string;
  isLoading: boolean;
  error?: string;
}

export const useWallet = () => {
  const auth = useAuth();
  const [balance, setBalance] = useState<WalletBalance>({
    balance: '0.0',
    isLoading: false,
  });

  // Fetch Flow balance when user is authenticated
  useEffect(() => {
    const fetchBalance = async () => {
      if (!auth.isAuthenticated || !auth.user.addr) {
        setBalance({ balance: '0.0', isLoading: false });
        return;
      }

      setBalance(prev => ({ ...prev, isLoading: true }));
      
      try {
        const result = await getFlowBalance(auth.user.addr);
        setBalance({
          balance: result.balance,
          isLoading: false,
          error: result.error,
        });
      } catch (error) {
        setBalance({
          balance: '0.0',
          isLoading: false,
          error: 'Failed to fetch balance',
        });
      }
    };

    fetchBalance();
  }, [auth.isAuthenticated, auth.user.addr]);

  const refreshBalance = async () => {
    if (!auth.isAuthenticated || !auth.user.addr) return;
    
    setBalance(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await getFlowBalance(auth.user.addr);
      setBalance({
        balance: result.balance,
        isLoading: false,
        error: result.error,
      });
    } catch (error) {
      setBalance(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh balance',
      }));
    }
  };

  return {
    ...auth,
    balance: balance.balance,
    balanceLoading: balance.isLoading,
    balanceError: balance.error,
    refreshBalance,
    // Helper methods
    formatAddress: (address?: string) => {
      const addr = address || auth.user.addr;
      if (!addr) return '';
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    },
    hasNFTs: auth.isEligible,
    nftCollections: auth.collections,
    // Wallet type information
    isDapperWallet: auth.walletType === 'dapper',
    isFlowWallet: auth.walletType === 'flow',
    walletName: auth.walletInfo?.name || 'Unknown Wallet',
    walletIcon: auth.walletInfo?.icon || '💳',
  };
};