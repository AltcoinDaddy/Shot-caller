import { useEffect, useRef, useCallback } from 'react'
import { useMobileInfo } from './use-mobile'

interface TouchInteractionOptions {
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  longPressDelay?: number
  swipeThreshold?: number
  doubleTapDelay?: number
  enableFeedback?: boolean
}

export function useTouchInteractions<T extends HTMLElement>(
  options: TouchInteractionOptions = {}
) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    longPressDelay = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300,
    enableFeedback = true
  } = options

  const elementRef = useRef<T>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const { isTouchDevice } = useMobileInfo()

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const addTouchFeedback = useCallback((element: HTMLElement) => {
    if (!enableFeedback || !isTouchDevice) return

    element.style.transition = 'transform 0.1s ease, opacity 0.1s ease'
    element.style.transform = 'scale(0.95)'
    element.style.opacity = '0.8'

    setTimeout(() => {
      element.style.transform = 'scale(1)'
      element.style.opacity = '1'
    }, 100)
  }, [enableFeedback, isTouchDevice])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    const element = elementRef.current

    if (!touch || !element) return

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress()
        if (enableFeedback) {
          // Haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }, longPressDelay)
    }

    // Add visual feedback
    if (enableFeedback) {
      addTouchFeedback(element)
    }
  }, [onLongPress, longPressDelay, enableFeedback, addTouchFeedback])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Clear long press timer on move
    clearLongPressTimer()
  }, [clearLongPressTimer])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchStart = touchStartRef.current
    const touch = e.changedTouches[0]

    if (!touchStart || !touch) return

    clearLongPressTimer()

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const deltaTime = Date.now() - touchStart.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Check for swipe gestures
    if (distance > swipeThreshold && deltaTime < 500) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
      return
    }

    // Check for tap gestures (small movement, quick release)
    if (distance < 10 && deltaTime < 500) {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        // Double tap
        onDoubleTap()
        lastTapRef.current = 0 // Reset to prevent triple tap
      } else {
        // Single tap (with delay to check for double tap)
        if (onTap && !onDoubleTap) {
          onTap()
        } else if (onTap && onDoubleTap) {
          setTimeout(() => {
            const finalTimeSinceLastTap = Date.now() - lastTapRef.current
            if (finalTimeSinceLastTap >= doubleTapDelay) {
              onTap()
            }
          }, doubleTapDelay)
        }
        lastTapRef.current = now
      }
    }

    touchStartRef.current = null
  }, [
    clearLongPressTimer,
    swipeThreshold,
    onSwipeRight,
    onSwipeLeft,
    onSwipeDown,
    onSwipeUp,
    onTap,
    onDoubleTap,
    doubleTapDelay
  ])

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer()
    touchStartRef.current = null
  }, [clearLongPressTimer])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !isTouchDevice) return

    // Add touch event listeners with passive option for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      clearLongPressTimer()
    }
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    clearLongPressTimer,
    isTouchDevice
  ])

  return elementRef
}

// Hook for swipe navigation
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  return useTouchInteractions({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: 100,
    enableFeedback: false
  })
}

// Hook for pull-to-refresh
export function usePullToRefresh(onRefresh: () => void, threshold: number = 80) {
  const elementRef = useRef<HTMLElement>(null)
  const startYRef = useRef<number>(0)
  const isPullingRef = useRef<boolean>(false)
  const { isTouchDevice } = useMobileInfo()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - startYRef.current

    if (deltaY > 0 && window.scrollY === 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault()
      
      // Add visual feedback based on pull distance
      const element = elementRef.current
      if (element) {
        const pullRatio = Math.min(deltaY / threshold, 1)
        element.style.transform = `translateY(${deltaY * 0.5}px)`
        element.style.opacity = `${1 - pullRatio * 0.3}`
      }
    }
  }, [threshold])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current) return

    const currentY = e.changedTouches[0].clientY
    const deltaY = currentY - startYRef.current

    const element = elementRef.current
    if (element) {
      element.style.transform = 'translateY(0)'
      element.style.opacity = '1'
      element.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      
      setTimeout(() => {
        element.style.transition = ''
      }, 300)
    }

    if (deltaY > threshold) {
      onRefresh()
    }

    isPullingRef.current = false
    startYRef.current = 0
  }, [threshold, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !isTouchDevice) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isTouchDevice])

  return elementRef
}