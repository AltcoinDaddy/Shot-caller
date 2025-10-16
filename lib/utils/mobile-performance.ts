/**
 * Mobile Performance Optimization Utilities
 * Provides utilities for optimizing performance on mobile devices
 */

// Debounce function for touch events
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Check if device is mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// Check if device supports touch
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Get device pixel ratio for image optimization
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1
  
  return window.devicePixelRatio || 1
}

// Optimize image loading for mobile
export function getOptimizedImageSize(
  baseWidth: number,
  baseHeight: number,
  maxWidth: number = 400
): { width: number; height: number } {
  const pixelRatio = getDevicePixelRatio()
  const isMobile = isMobileDevice()
  
  // Reduce image size on mobile devices
  const scaleFactor = isMobile ? 0.8 : 1
  const targetWidth = Math.min(baseWidth * scaleFactor, maxWidth)
  const targetHeight = (baseHeight * targetWidth) / baseWidth
  
  return {
    width: Math.round(targetWidth * pixelRatio),
    height: Math.round(targetHeight * pixelRatio)
  }
}

// Lazy loading intersection observer options
export const LAZY_LOADING_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
}

// Preload critical resources
export function preloadCriticalResources(urls: string[]): void {
  if (typeof window === 'undefined') return
  
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

// Optimize animations for mobile
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Memory management for mobile
export function cleanupUnusedResources(): void {
  if (typeof window === 'undefined') return
  
  // Force garbage collection if available (Chrome DevTools)
  if ('gc' in window && typeof (window as any).gc === 'function') {
    (window as any).gc()
  }
}

// Viewport utilities
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

// Safe area utilities for mobile devices with notches
export function getSafeAreaInsets(): {
  top: number
  right: number
  bottom: number
  left: number
} {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }
  
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
  }
}

// Touch event utilities
export function addTouchFeedback(element: HTMLElement): () => void {
  if (!isTouchDevice()) return () => {}
  
  const handleTouchStart = () => {
    element.style.transform = 'scale(0.95)'
    element.style.transition = 'transform 0.1s ease'
  }
  
  const handleTouchEnd = () => {
    element.style.transform = 'scale(1)'
  }
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true })
  element.addEventListener('touchend', handleTouchEnd, { passive: true })
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true })
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchEnd)
  }
}

// Network-aware loading
export function getConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown'
  }
  
  const connection = (navigator as any).connection
  
  if (connection.effectiveType === '4g') return 'fast'
  if (connection.effectiveType === '3g') return 'fast'
  if (connection.effectiveType === '2g') return 'slow'
  if (connection.effectiveType === 'slow-2g') return 'slow'
  
  return 'unknown'
}

// Battery-aware optimizations
export function shouldOptimizeForBattery(): boolean {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return false
  }
  
  // This is a simplified check - in practice you'd want to check battery level
  return isMobileDevice()
}