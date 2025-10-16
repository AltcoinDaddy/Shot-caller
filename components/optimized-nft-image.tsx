"use client"

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Trophy, ImageIcon } from 'lucide-react';

interface OptimizedNFTImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
  fallbackIcon?: React.ReactNode;
  loadingText?: string;
  errorText?: string;
}

export const OptimizedNFTImage: React.FC<OptimizedNFTImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  quality = 85,
  sizes = "(max-width: 768px) 100vw, 50vw",
  placeholder = 'blur',
  onLoad,
  onError,
  fallbackIcon = <Trophy className="h-8 w-8" />,
  loadingText = "Loading...",
  errorText = "Image Error",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const generateBlurDataURL = (width: number = 8, height: number = 8) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.1);
  };

  return (
    <div ref={imageRef} className={cn("relative w-full h-full", className)}>
      {/* Loading/Error Placeholder */}
      {(isLoading || hasError || !isVisible) && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center",
          isLoading && "animate-pulse"
        )}>
          <div className="text-center text-muted-foreground">
            <div className={cn(
              "mx-auto mb-2 opacity-50",
              isLoading && "animate-spin"
            )}>
              {hasError ? <ImageIcon className="h-8 w-8" /> : fallbackIcon}
            </div>
            <div className="text-xs">
              {hasError ? errorText : isLoading ? loadingText : "Loading..."}
            </div>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      {isVisible && src && (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          sizes={sizes}
          quality={quality}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
          unoptimized={false}
        />
      )}
    </div>
  );
};

// Preload images for better performance
export const preloadNFTImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch preload multiple images
export const preloadNFTImages = async (srcs: string[]): Promise<void> => {
  const promises = srcs.map(src => preloadNFTImage(src));
  await Promise.allSettled(promises);
};

// Image optimization utilities
export const getOptimizedImageUrl = (
  originalUrl: string,
  width?: number,
  height?: number,
  quality: number = 85
): string => {
  // If using a CDN like Cloudinary, Imgix, etc., you can add transformation parameters
  // For now, return the original URL with Next.js optimization
  if (!originalUrl) return originalUrl;
  
  // Add Next.js image optimization parameters
  const url = new URL(originalUrl, window.location.origin);
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
};

// WebP support detection
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// AVIF support detection
export const supportsAVIF = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
};

// Get optimal image format
export const getOptimalImageFormat = (originalUrl: string): string => {
  if (!originalUrl) return originalUrl;
  
  if (supportsAVIF()) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  } else if (supportsWebP()) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  return originalUrl;
};

// Generate responsive image sizes
export const generateImageSizes = (breakpoints: Record<string, string>): string => {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
};

// Common size configurations
export const NFT_IMAGE_SIZES = {
  card: generateImageSizes({
    '640px': '100vw',
    '768px': '50vw',
    '1024px': '33vw',
    '1280px': '25vw',
  }),
  cardCompact: generateImageSizes({
    '640px': '50vw',
    '768px': '33vw',
    '1024px': '25vw',
    '1280px': '20vw',
  }),
  hero: generateImageSizes({
    '640px': '100vw',
    '768px': '100vw',
    '1024px': '50vw',
  }),
  thumbnail: generateImageSizes({
    '640px': '25vw',
    '768px': '20vw',
    '1024px': '15vw',
  }),
};