"use client"

import React, { ReactNode } from 'react'
import { useMobileInfo } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: ReactNode
  className?: string
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const { isMobile, isTablet, isDesktop, isTouchDevice, orientation } = useMobileInfo()

  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        // Safe area support for mobile devices
        isMobile && "safe-area-top safe-area-bottom",
        // Orientation-specific styles
        isMobile && orientation === 'landscape' && "px-safe-area-left px-safe-area-right",
        className
      )}
      data-mobile={isMobile}
      data-tablet={isTablet}
      data-desktop={isDesktop}
      data-touch={isTouchDevice}
      data-orientation={orientation}
    >
      {children}
    </div>
  )
}

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  const { isMobile, isTablet } = useMobileInfo()

  return (
    <div className={cn(
      "container mx-auto",
      // Responsive padding
      isMobile ? "px-4 py-6" : isTablet ? "px-6 py-8" : "px-8 py-10",
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export function ResponsiveGrid({ 
  children, 
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 }
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useMobileInfo()

  return (
    <div className={cn(
      "grid gap-4",
      // Dynamic grid columns based on device
      isMobile && `grid-cols-${columns.mobile}`,
      isTablet && `md:grid-cols-${columns.tablet}`,
      `lg:grid-cols-${columns.desktop}`,
      // Responsive gap
      isMobile ? "gap-4" : isTablet ? "gap-5" : "gap-6",
      className
    )}>
      {children}
    </div>
  )
}

interface TouchFriendlyCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export function TouchFriendlyCard({ 
  children, 
  className, 
  onClick,
  href 
}: TouchFriendlyCardProps) {
  const { isTouchDevice, isMobile } = useMobileInfo()

  const cardProps = {
    className: cn(
      "transition-all duration-200",
      isTouchDevice && "touch-target active:scale-95",
      isMobile && "mobile-card",
      onClick && "cursor-pointer",
      className
    ),
    onClick,
    ...(href && { 
      role: "button",
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (href) window.location.href = href
          if (onClick) onClick()
        }
      }
    })
  }

  if (href && !onClick) {
    return (
      <a href={href} className="block">
        <div {...cardProps}>
          {children}
        </div>
      </a>
    )
  }

  return (
    <div {...cardProps}>
      {children}
    </div>
  )
}

interface MobileOptimizedButtonProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function MobileOptimizedButton({
  children,
  className,
  size = 'default',
  variant = 'default',
  onClick,
  disabled,
  type = 'button'
}: MobileOptimizedButtonProps) {
  const { isTouchDevice, isMobile } = useMobileInfo()

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base button styles
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Variant styles
        variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // Size styles
        size === 'sm' && "h-9 px-3 text-sm",
        size === 'default' && "h-10 px-4 py-2",
        size === 'lg' && "h-11 px-8",
        
        // Mobile optimizations
        isTouchDevice && "mobile-button min-h-[44px]",
        isMobile && size === 'sm' && "h-10 px-4 text-sm",
        isMobile && size === 'default' && "h-12 px-6",
        isMobile && size === 'lg' && "h-14 px-8 text-lg",
        
        // Touch feedback
        isTouchDevice && "active:scale-95",
        
        className
      )}
    >
      {children}
    </button>
  )
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile: T
  tablet?: T
  desktop?: T
}): T {
  const { isMobile, isTablet } = useMobileInfo()
  
  if (isMobile) return values.mobile
  if (isTablet && values.tablet) return values.tablet
  return values.desktop || values.tablet || values.mobile
}

// Hook for responsive classes
export function useResponsiveClasses(classes: {
  mobile: string
  tablet?: string
  desktop?: string
}): string {
  const { isMobile, isTablet } = useMobileInfo()
  
  if (isMobile) return classes.mobile
  if (isTablet && classes.tablet) return classes.tablet
  return classes.desktop || classes.tablet || classes.mobile
}