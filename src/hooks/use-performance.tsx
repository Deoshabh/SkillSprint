'use client'

import { useEffect, useState, useRef } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  
  // Mobile-specific metrics
  deviceMemory?: number
  connectionType?: string
  connectionDownlink?: number
  batteryLevel?: number
  isLowEndDevice?: boolean
  
  // Runtime metrics
  jsHeapSizeUsed?: number
  jsHeapSizeLimit?: number
  
  // Navigation timing
  domContentLoaded?: number
  loadComplete?: number
}

interface NetworkInformation extends EventTarget {
  downlink?: number
  effectiveType?: string
  rtt?: number
  saveData?: boolean
}

declare global {
  interface Navigator {
    deviceMemory?: number
    connection?: NetworkInformation
  }
  interface Window {
    webkitRequestFileSystem?: any
  }
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  const observerRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    // Detect low-end device
    const detectLowEndDevice = () => {
      const memory = (navigator as any).deviceMemory || 4
      const cores = navigator.hardwareConcurrency || 4
      const connection = (navigator as any).connection
      
      const isLowEnd = 
        memory <= 2 || 
        cores <= 2 || 
        (connection && connection.effectiveType === 'slow-2g') ||
        (connection && connection.effectiveType === '2g') ||
        (connection && connection.saveData)
      
      setIsLowEndDevice(isLowEnd)
      return isLowEnd
    }

    // Get device and network information
    const getDeviceInfo = (): Partial<PerformanceMetrics> => {
      const info: Partial<PerformanceMetrics> = {}
      
      // Device memory
      if ('deviceMemory' in navigator) {
        info.deviceMemory = navigator.deviceMemory
      }
      
      // Network information
      if ('connection' in navigator && navigator.connection) {
        const conn = navigator.connection
        info.connectionType = conn.effectiveType
        info.connectionDownlink = conn.downlink
      }
      
      // Battery information (deprecated but still useful)
      if ('getBattery' in navigator) {
        ;(navigator as any).getBattery().then((battery: any) => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level
          }))
        }).catch(() => {
          // Battery API not available
        })
      }
      
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        info.jsHeapSizeUsed = memory.usedJSHeapSize
        info.jsHeapSizeLimit = memory.totalJSHeapSize
      }
      
      info.isLowEndDevice = detectLowEndDevice()
      
      return info
    }

    // Get navigation timing
    const getNavigationTiming = (): Partial<PerformanceMetrics> => {
      if (typeof performance !== 'undefined' && performance.timing) {
        const timing = performance.timing
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          ttfb: timing.responseStart - timing.navigationStart,
        }
      }
      return {}
    }

    // Set initial metrics
    setMetrics({
      ...getDeviceInfo(),
      ...getNavigationTiming()
    })

    // Observe Core Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }))
              break
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }))
              break
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cls: (prev.cls || 0) + (entry as any).value 
                }))
              }
              break
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
              }
              break
          }
        }
      })

      // Observe different entry types
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        observer.observe({ entryTypes: ['first-input'] })
        observer.observe({ entryTypes: ['layout-shift'] })
        observer.observe({ entryTypes: ['paint'] })
      } catch (error) {
        console.warn('Performance observer failed:', error)
      }

      observerRef.current = observer
    }

    // Monitor network changes
    const handleConnectionChange = () => {
      setMetrics(prev => ({
        ...prev,
        ...getDeviceInfo()
      }))
    }

    if ('connection' in navigator && navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if ('connection' in navigator && navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return { metrics, isLowEndDevice }
}

// Performance reporting component
export function PerformanceMonitor({ 
  onMetricsUpdate,
  reportToAnalytics = false 
}: {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  reportToAnalytics?: boolean
}) {
  const { metrics, isLowEndDevice } = usePerformanceMonitoring()

  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics)
    }

    // Report to analytics service (if enabled)
    if (reportToAnalytics && Object.keys(metrics).length > 0) {
      // TODO: Send to analytics service
      console.log('Performance Metrics:', metrics)
    }
  }, [metrics, onMetricsUpdate, reportToAnalytics])

  useEffect(() => {
    // Apply optimizations for low-end devices
    if (isLowEndDevice) {
      document.body.classList.add('low-end-device')
      
      // Reduce animations
      const style = document.createElement('style')
      style.textContent = `
        .low-end-device * {
          animation-duration: 0.1s !important;
          animation-delay: 0s !important;
          transition-duration: 0.1s !important;
        }
        .low-end-device .blur {
          backdrop-filter: none !important;
        }
      `
      document.head.appendChild(style)

      return () => {
        document.body.classList.remove('low-end-device')
        document.head.removeChild(style)
      }
    }
  }, [isLowEndDevice])

  return null
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Check if device is low-end
  isLowEndDevice: (): boolean => {
    const memory = (navigator as any).deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const connection = (navigator as any).connection
    
    return (
      memory <= 2 || 
      cores <= 2 || 
      (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'))
    )
  },

  // Get connection speed
  getConnectionSpeed: (): string => {
    const connection = (navigator as any).connection
    if (connection) {
      return connection.effectiveType || 'unknown'
    }
    return 'unknown'
  },

  // Check if save-data is enabled
  isSaveDataEnabled: (): boolean => {
    const connection = (navigator as any).connection
    return connection ? !!connection.saveData : false
  },

  // Measure frame rate
  measureFPS: (duration = 1000): Promise<number> => {
    return new Promise((resolve) => {
      let frames = 0
      const startTime = performance.now()
      
      const countFrame = () => {
        frames++
        const currentTime = performance.now()
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = frames / ((currentTime - startTime) / 1000)
          resolve(Math.round(fps))
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  },

  // Lazy load images for low-end devices
  lazyLoadImage: (img: HTMLImageElement, src: string, lowQualitySrc?: string) => {
    const isLowEnd = performanceUtils.isLowEndDevice()
    const isSaveData = performanceUtils.isSaveDataEnabled()
    
    if (isLowEnd || isSaveData) {
      img.src = lowQualitySrc || src
    } else {
      img.src = src
    }
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }) as T
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }
}
