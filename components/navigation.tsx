"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { WalletConnectorCompact } from "@/components/wallet-connector"
import { useAuth } from "@/contexts/auth-context"
import { usePremium } from "@/hooks/use-premium"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  { href: "/", label: "HOME" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/marketplace", label: "MARKETPLACE" },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isEligible, eligibilityReason, collections } = useAuth()
  const { isPremium, daysRemaining, isExpiringSoon } = usePremium()

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="text-3xl font-bold tracking-tighter transition-all group-hover:scale-105 group-hover:tracking-tight holographic">
              SHOTCALLER
            </span>
          </Link>

          {/* Desktop Navigation - Main Items */}
          <div className="hidden lg:flex items-center gap-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-bold tracking-wide transition-all duration-300 hover:text-foreground hover:scale-110 relative",
                  pathname === item.href
                    ? "text-foreground after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-foreground after:animate-in after:slide-in-from-left after:duration-300"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Wallet Connector */}
            <div className="hidden sm:flex items-center gap-2">
              {isPremium && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20",
                    isExpiringSoon && "animate-pulse"
                  )}
                >
                  Premium {isExpiringSoon && `(${daysRemaining}d)`}
                </Badge>
              )}
              <WalletConnectorCompact />
              {isAuthenticated && !isEligible && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    No NFTs
                  </Badge>
                </div>
              )}
              {isAuthenticated && isEligible && collections.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {collections.join(", ")}
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden transition-all hover:scale-110 hover:rotate-90"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-lg font-bold tracking-wide transition-all duration-300 hover:text-foreground hover:translate-x-2 py-2",
                    pathname === item.href ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Wallet Connector */}
              <div className="mt-4 space-y-2">
                <WalletConnectorCompact className="w-full" />
                {isAuthenticated && !isEligible && eligibilityReason && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700">{eligibilityReason}</span>
                  </div>
                )}
                {isAuthenticated && isEligible && collections.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {collections.map((collection) => (
                      <Badge key={collection} variant="secondary" className="text-xs">
                        {collection}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
