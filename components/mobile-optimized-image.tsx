"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useMobileInfo } from '@/hooks/use-mobile'
import { getOptimizedImageSize, LAZY_LOADING_OPTIONS } from '@/lib/utils/mobile-performance'

interface MobileOptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
  onError?: () => void
  lazy?: boolean
  mobileMaxWidth?: number
}

export function MobileOptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
  lazy = true,
  mobileMaxWidth = 400,
  ...props
}: MobileOptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(!lazy || priority)
  const imageRef = useRef<HTMLDivElement>(null)
  const { isMobile, screenWidth } = useMobileInfo()

  // Optimize image dimensions for mobile
  const optimizedDimensions = width && height 
    ? getOptimizedImageSize(width, height, mobileMaxWidth)
    : { width: width || 400, height: height || 300 }

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    isMobile 
      ? `(max-width: 640px) ${Math.min(screenWidth, mobileMaxWidth)}px, ${mobileMaxWidth}px`
      : `(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`
  )

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || priority || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      LAZY_LOADING_OPTIONS
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isVisible])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    if (blurDataURL) return blurDataURL
    
    // Simple base64 encoded 1x1 pixel image
    return `data:image/svg+xml;base64,${btoa(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>`
    )}`
  }

  return (
    <div
      ref={imageRef}
      className={cn(
        "relative overflow-hidden",
        !isLoaded && "animate-pulse bg-muted",
        className
      )}
      style={!fill ? { 
        width: optimizedDimensions.width, 
        height: optimizedDimensions.height 
      } : undefined}
    >
      {isVisible && !hasError ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : optimizedDimensions.width}
          height={fill ? undefined : optimizedDimensions.height}
          fill={fill}
          quality={isMobile ? Math.min(quality, 80) : quality} // Reduce quality on mobile
          priority={priority}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? generateBlurDataURL(
            optimizedDimensions.width, 
            optimizedDimensions.height
          ) : undefined}
          sizes={responsiveSizes}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            fill && `object-${objectFit}`
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : hasError ? (
        // Error fallback
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Image not available</div>
          </div>
        </div>
      ) : !isVisible ? (
        // Loading placeholder for lazy loading
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : null}

      {/* Loading overlay */}
      {isVisible && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}

// Specialized component for NFT images with mobile optimization
export function MobileNFTImage({
  src,
  alt,
  className = "",
  priority = false,
  ...props
}: Omit<MobileOptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <MobileOptimizedImage
      src={src}
      alt={alt}
      fill
      className={cn("aspect-square", className)}
      priority={priority}
      quality={85}
      placeholder="blur"
      objectFit="cover"
      mobileMaxWidth={300}
      {...props}
    />
  )
}

// Specialized component for hero images
export function MobileHeroImage({
  src,
  alt,
  className = "",
  priority = true,
  ...props
}: Omit<MobileOptimizedImageProps, 'width' | 'height' | 'fill' | 'lazy'>) {
  return (
    <MobileOptimizedImage
      src={src}
      alt={alt}
      fill
      className={cn("aspect-video sm:aspect-[21/9]", className)}
      priority={priority}
      quality={90}
      placeholder="blur"
      objectFit="cover"
      lazy={false}
      mobileMaxWidth={800}
      {...props}
    />
  )
}