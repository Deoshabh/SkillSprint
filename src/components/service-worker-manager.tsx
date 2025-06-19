'use client'

import { useEffect, useState } from 'react'

/**
 * Service Worker Manager Hook
 * Provides utilities to interact with the service worker
 */
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true)
      checkServiceWorkerStatus()
    }
  }, [])

  const checkServiceWorkerStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        setIsInstalled(true)
        
        // Get version info
        const version = await getServiceWorkerVersion()
        setVersion(version)
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          setIsUpdating(true)
          const newWorker = registration.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                setIsUpdating(false)
                // Optionally notify user of update
                console.log('🔄 New service worker version available')
              }
            })
          }
        })
      }
    } catch (error) {
      console.error('Service worker status check failed:', error)
    }
  }

  const getServiceWorkerVersion = (): Promise<string> => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          const { type, version } = event.data
          if (type === 'VERSION_INFO') {
            resolve(version || 'Unknown')
          }
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        )
      } else {
        resolve('Not available')
      }
    })
  }

  const updateServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
    } catch (error) {
      console.error('Service worker update failed:', error)
    }
  }

  const clearCache = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          const { type, success } = event.data
          if (type === 'CACHE_CLEARED') {
            resolve(success || false)
          }
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      } else {
        resolve(false)
      }
    })
  }

  const toggleDebugMode = (enabled: boolean) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_DEBUG_MODE',
        payload: { enabled }
      })
    }
  }

  return {
    isSupported,
    isInstalled,
    isUpdating,
    version,
    updateServiceWorker,
    clearCache,
    toggleDebugMode
  }
}

/**
 * Service Worker Status Component
 * Displays service worker status and provides management controls
 */
export function ServiceWorkerStatus() {
  const {
    isSupported,
    isInstalled,
    isUpdating,
    version,
    updateServiceWorker,
    clearCache,
    toggleDebugMode
  } = useServiceWorker()

  const [debugMode, setDebugMode] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleClearCache = async () => {
    setClearing(true)
    try {
      const success = await clearCache()
      if (success) {
        console.log('✅ Cache cleared successfully')
        // Optionally show user notification
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error)
    } finally {
      setClearing(false)
    }
  }

  const handleToggleDebug = () => {
    const newDebugMode = !debugMode
    setDebugMode(newDebugMode)
    toggleDebugMode(newDebugMode)
    console.log(`🔧 Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`)
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Service Worker not supported
      </div>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span>Service Worker:</span>
        <span className={`px-2 py-1 rounded text-xs ${
          isInstalled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isInstalled ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {version && (
        <div className="flex items-center justify-between">
          <span>Version:</span>
          <span className="text-muted-foreground">{version}</span>
        </div>
      )}
      
      {isUpdating && (
        <div className="text-blue-600 text-xs">
          🔄 Update available...
        </div>
      )}
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={updateServiceWorker}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </button>
        
        <button
          onClick={handleClearCache}
          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          disabled={clearing}
        >
          {clearing ? 'Clearing...' : 'Clear Cache'}
        </button>
        
        <button
          onClick={handleToggleDebug}
          className={`px-3 py-1 rounded text-xs ${
            debugMode 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Debug: {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}

/**
 * Ad Blocker Status Component
 * Shows ad blocking statistics and status
 */
export function AdBlockerStatus() {
  const [stats, setStats] = useState({
    requestCount: 0,
    blockedCount: 0,
    blockRate: 0
  })

  useEffect(() => {
    // Listen for service worker messages about blocked requests
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data || {}
        if (type === 'AD_BLOCK_STATS') {
          setStats(payload)
        }
      })
    }
  }, [])

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <h3 className="font-semibold text-green-800">Ad Blocker Active</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-bold text-lg text-green-700">{stats.requestCount}</div>
          <div className="text-green-600">Requests</div>
        </div>
        
        <div className="text-center">
          <div className="font-bold text-lg text-red-700">{stats.blockedCount}</div>
          <div className="text-red-600">Blocked</div>
        </div>
        
        <div className="text-center">
          <div className="font-bold text-lg text-blue-700">{stats.blockRate}%</div>
          <div className="text-blue-600">Block Rate</div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-green-700">
        🛡️ Blocking YouTube ads, trackers, and unwanted content
      </div>
    </div>
  )
}
