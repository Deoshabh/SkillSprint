'use client'

import { useEffect, useState } from 'react'

interface ViewportInfo {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  isStandalone: boolean
}

export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait',
    isStandalone: false,
  })

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      const orientation = width > height ? 'landscape' : 'portrait'
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        isStandalone,
      })
    }

    // Initial update
    updateViewport()

    // Listen for viewport changes
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', () => {
      // Delay to ensure viewport has updated after orientation change
      setTimeout(updateViewport, 100)
    })

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  return viewport
}

export function MobileViewportManager() {
  const viewport = useViewport()

  useEffect(() => {
    // Handle mobile viewport issues
    if (viewport.isMobile) {
      // Fix iOS viewport height issues
      const setVH = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }

      setVH()
      window.addEventListener('resize', setVH)
      window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 100)
      })

      // Prevent zoom on input focus (iOS)
      const preventZoom = (e: Event) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
          if (meta) {
            const originalContent = meta.content
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
            
            // Reset after blur
            const resetViewport = () => {
              meta.content = originalContent
              target.removeEventListener('blur', resetViewport)
            }
            target.addEventListener('blur', resetViewport)
          }
        }
      }

      document.addEventListener('focusin', preventZoom)

      return () => {
        window.removeEventListener('resize', setVH)
        window.removeEventListener('orientationchange', setVH)
        document.removeEventListener('focusin', preventZoom)
      }
    }
  }, [viewport.isMobile])

  useEffect(() => {
    // Add CSS classes based on viewport
    const bodyClasses = document.body.classList

    // Remove existing viewport classes
    bodyClasses.remove('is-mobile', 'is-tablet', 'is-desktop', 'is-landscape', 'is-portrait', 'is-standalone')

    // Add current viewport classes
    if (viewport.isMobile) bodyClasses.add('is-mobile')
    if (viewport.isTablet) bodyClasses.add('is-tablet')
    if (viewport.isDesktop) bodyClasses.add('is-desktop')
    if (viewport.orientation === 'landscape') bodyClasses.add('is-landscape')
    if (viewport.orientation === 'portrait') bodyClasses.add('is-portrait')
    if (viewport.isStandalone) bodyClasses.add('is-standalone')
  }, [viewport])

  return null
}

// Utility function to detect mobile features
export function getMobileCapabilities() {
  if (typeof window === 'undefined') return null

  return {
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isChrome: /Chrome/.test(navigator.userAgent),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    hasNotificationSupport: 'Notification' in window,
    hasServiceWorkerSupport: 'serviceWorker' in navigator,
    hasPushSupport: 'PushManager' in window,
    hasWebShareSupport: 'share' in navigator,
    hasVibrationSupport: 'vibrate' in navigator,
  }
}
