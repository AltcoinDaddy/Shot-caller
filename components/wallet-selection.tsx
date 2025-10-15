"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WALLET_SERVICES } from '@/lib/flow-config';
import { CheckCircle, Star } from 'lucide-react';

interface WalletSelectionProps {
  className?: string;
}

export const WalletSelection: React.FC<WalletSelectionProps> = ({ className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your Wallet</h3>
        <p className="text-sm text-muted-foreground">
          ShotCaller supports multiple Flow wallets for your convenience
        </p>
      </div>
      
      <div className="grid gap-4">
        {/* Dapper Wallet - Recommended */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xl">{WALLET_SERVICES.DAPPER.icon}</span>
                {WALLET_SERVICES.DAPPER.name}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            </div>
            <CardDescription className="text-sm">
              {WALLET_SERVICES.DAPPER.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>NBA Top Shot & NFL All Day optimized</span>
            </div>
          </CardContent>
        </Card>

        {/* Flow Wallet */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-xl">{WALLET_SERVICES.FLOW_WALLET.icon}</span>
              {WALLET_SERVICES.FLOW_WALLET.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {WALLET_SERVICES.FLOW_WALLET.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Official Flow blockchain wallet</span>
            </div>
          </CardContent>
        </Card>

        {/* Blocto Wallet */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-xl">{WALLET_SERVICES.BLOCTO.icon}</span>
              {WALLET_SERVICES.BLOCTO.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {WALLET_SERVICES.BLOCTO.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Multi-chain support with Flow integration</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/30 rounded-md">
        <strong>Note:</strong> Dapper Wallet is recommended for the best NBA Top Shot and NFL All Day experience, 
        but all wallets support Flow blockchain transactions.
      </div>
    </div>
  );
};