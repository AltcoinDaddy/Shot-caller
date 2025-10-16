"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { useMobileInfo } from '@/hooks/use-mobile'

interface MobileLayoutProps {
  children: React.ReactNode
  className?: string
  enableSafeArea?: boolean
  optimizeForTouch?: boolean
}

export function MobileLayout({ 
  children, 
  className = "",
  enableSafeArea = true,
  optimizeForTouch = true
}: MobileLayoutProps) {
  const { isMobile, isTablet, orientation } = useMobileInfo()

  return (
    <div
      className={cn(
        "min-h-screen",
        // Safe area support for devices with notches
        enableSafeArea && [
          "pt-[env(safe-area-inset-top)]",
          "pr-[env(safe-area-inset-right)]", 
          "pb-[env(safe-area-inset-bottom)]",
          "pl-[env(safe-area-inset-left)]"
        ],
        // Touch optimization
        optimizeForTouch && isMobile && [
          "touch-pan-y", // Allow vertical scrolling
          "select-none", // Prevent text selection on touch
        ],
        // Orientation-specific styles
        orientation === 'landscape' && isMobile && "landscape:px-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function MobileContainer({ 
  children, 
  className = "",
  maxWidth = 'lg',
  padding = 'md'
}: MobileContainerProps) {
  const { isMobile } = useMobileInfo()

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  }

  return (
    <div
      className={cn(
        "container mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        // Mobile-specific adjustments
        isMobile && "px-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export function MobileGrid({ 
  children, 
  className = "",
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}: MobileGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8'
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  return (
    <div
      className={cn(
        "grid mobile-grid",
        cols.mobile && gridCols[cols.mobile as keyof typeof gridCols],
        cols.tablet && `sm:${gridCols[cols.tablet as keyof typeof gridCols]}`,
        cols.desktop && `lg:${gridCols[cols.desktop as keyof typeof gridCols]}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileStackProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end'
}

export function MobileStack({ 
  children, 
  className = "",
  spacing = 'md',
  align = 'start'
}: MobileStackProps) {
  const spacingClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center', 
    end: 'items-end'
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        spacingClasses[spacing],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function MobileSection({ 
  children, 
  className = "",
  title,
  subtitle,
  padding = 'md'
}: MobileSectionProps) {
  const paddingClasses = {
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8 lg:py-12',
    lg: 'py-8 sm:py-12 lg:py-16'
  }

  return (
    <section className={cn(paddingClasses[padding], className)}>
      {(title || subtitle) && (
        <div className="mb-6 sm:mb-8">
          {title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 mobile-heading">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base sm:text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}