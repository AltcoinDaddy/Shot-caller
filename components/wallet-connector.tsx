"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { Wallet, LogOut, User, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { getWalletServiceInfo, isDapperWallet, isFlowWallet, WALLET_SERVICES } from '@/lib/flow-config';
import { WalletSelection } from '@/components/wallet-selection';

interface WalletConnectorProps {
  className?: string;
  showBalance?: boolean;
  showWalletSelection?: boolean;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ 
  className = "",
  showBalance = false,
  showWalletSelection = true
}) => {
  const { user, isLoading, login, logout, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);

  const handleConnect = async () => {
    try {
      setError(null);
      await login();
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await logout();
    } catch (err) {
      setError('Failed to disconnect wallet. Please try again.');
      console.error('Wallet disconnection error:', err);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getConnectedWalletInfo = () => {
    if (!user.services || user.services.length === 0) return null;
    
    // Check for Dapper Wallet first (preferred for NBA Top Shot/NFL All Day)
    if (isDapperWallet(user.services)) {
      return { ...WALLET_SERVICES.DAPPER, isPrimary: true };
    }
    
    // Check for Flow Wallet
    if (isFlowWallet(user.services)) {
      return { ...WALLET_SERVICES.FLOW_WALLET, isPrimary: false };
    }
    
    // Check for other supported wallets
    const connectedService = user.services.find(service => 
      Object.values(WALLET_SERVICES).some(ws => ws.id === service.id)
    );
    
    if (connectedService) {
      const walletInfo = getWalletServiceInfo(connectedService.id);
      return walletInfo ? { ...walletInfo, isPrimary: false } : null;
    }
    
    return null;
  };

  const connectedWallet = getConnectedWalletInfo();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Connecting...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={className}>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          <Button 
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
          
          {showWalletSelection && (
            <Collapsible open={showSelection} onOpenChange={setShowSelection}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full flex items-center gap-2 text-xs"
                >
                  <span>Supported Wallets</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showSelection ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <WalletSelection />
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {!showWalletSelection && (
            <div className="text-xs text-muted-foreground text-center">
              Supports Dapper, Flow Wallet & Blocto
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Wallet Connected
            {connectedWallet?.isPrimary && (
              <Badge variant="default" className="text-xs ml-1">
                Recommended
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {formatAddress(user.addr || '')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {connectedWallet ? (
                  <>
                    <span className="mr-1">{connectedWallet.icon}</span>
                    {connectedWallet.name}
                  </>
                ) : (
                  'Unknown Wallet'
                )}
              </Badge>
              {connectedWallet?.isPrimary && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  NFT Ready
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Compact version for navigation
export const WalletConnectorCompact: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { user, isLoading, login, logout, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await login();
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await logout();
    } catch (err) {
      setError('Failed to disconnect wallet');
      console.error('Wallet disconnection error:', err);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getConnectedWalletInfo = () => {
    if (!user.services || user.services.length === 0) return null;
    
    if (isDapperWallet(user.services)) {
      return WALLET_SERVICES.DAPPER;
    }
    
    if (isFlowWallet(user.services)) {
      return WALLET_SERVICES.FLOW_WALLET;
    }
    
    const connectedService = user.services.find(service => 
      Object.values(WALLET_SERVICES).some(ws => ws.id === service.id)
    );
    
    if (connectedService) {
      return getWalletServiceInfo(connectedService.id);
    }
    
    return null;
  };

  const connectedWallet = getConnectedWalletInfo();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isLoading}
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        <Wallet className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="text-xs flex items-center gap-1">
        {connectedWallet && <span>{connectedWallet.icon}</span>}
        {formatAddress(user.addr || '')}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <LogOut className="h-3 w-3" />
      </Button>
    </div>
  );
};