"use client";

import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { initFlow, configureMultiWallet } from '@/lib/flow-config';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Flow configuration on client side
    initFlow();
    // Configure multi-wallet support (Dapper, Flow Wallet, Blocto)
    configureMultiWallet();
  }, []);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};