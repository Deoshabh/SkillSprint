'use client'

import { getMobileCapabilities } from '@/hooks/use-viewport'

type HapticPattern = number | number[]

interface HapticFeedback {
  light: () => void
  medium: () => void
  heavy: () => void
  success: () => void
  warning: () => void
  error: () => void
  selection: () => void
  impact: (intensity?: 'light' | 'medium' | 'heavy') => void
  notification: (type?: 'success' | 'warning' | 'error') => void
  custom: (pattern: HapticPattern) => void
}

function createHapticFeedback(): HapticFeedback {
  const capabilities = getMobileCapabilities()
  const hasVibration = capabilities?.hasVibrationSupport

  // Vibration patterns for different feedback types
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 50,
    success: [50, 50, 50],
    warning: [100, 50, 100],
    error: [100, 100, 100, 100, 100],
    selection: 5,
    doubleClick: [10, 50, 10],
    longPress: [0, 50, 100],
  }

  const vibrate = (pattern: HapticPattern) => {
    if (hasVibration && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.warn('Vibration failed:', error)
      }
    }
  }

  return {
    light: () => vibrate(patterns.light),
    medium: () => vibrate(patterns.medium),
    heavy: () => vibrate(patterns.heavy),
    success: () => vibrate(patterns.success),
    warning: () => vibrate(patterns.warning),
    error: () => vibrate(patterns.error),
    selection: () => vibrate(patterns.selection),
    impact: (intensity = 'medium') => vibrate(patterns[intensity]),
    notification: (type = 'success') => vibrate(patterns[type]),
    custom: (pattern: HapticPattern) => vibrate(pattern),
  }
}

// Global haptic feedback instance
export const haptic = createHapticFeedback()

// React hook for haptic feedback
export function useHaptic() {
  return haptic
}

// Higher-order component to add haptic feedback to buttons
interface WithHapticProps {
  hapticType?: keyof typeof haptic
  hapticIntensity?: 'light' | 'medium' | 'heavy'
  disabled?: boolean
  children: React.ReactNode
  onClick?: (event: React.MouseEvent) => void
  className?: string
}

export function withHaptic<T extends object>(
  Component: React.ComponentType<T>
) {
  return function HapticComponent(props: T & WithHapticProps) {
    const { 
      hapticType = 'selection', 
      hapticIntensity, 
      onClick, 
      disabled,
      ...componentProps 
    } = props

    const handleClick = (event: React.MouseEvent) => {
      if (!disabled) {
        // Trigger haptic feedback
        if (hapticType === 'impact' && hapticIntensity) {
          haptic.impact(hapticIntensity)
        } else if (hapticType in haptic) {
          ;(haptic as any)[hapticType]()
        }
      }

      // Call original onClick handler
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <Component
        {...(componentProps as T)}
        onClick={handleClick}
      />
    )
  }
}

// Pre-built haptic button components
export function HapticButton({
  children,
  hapticType = 'selection',
  hapticIntensity,
  onClick,
  disabled,
  className,
  ...props
}: WithHapticProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (hapticType === 'impact' && hapticIntensity) {
        haptic.impact(hapticIntensity)
      } else if (hapticType in haptic) {
        ;(haptic as any)[hapticType]()
      }
    }

    if (onClick) {
      onClick(event)
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}

// Utility functions for common haptic patterns
export const hapticUtils = {
  // For form submissions
  formSubmit: () => haptic.success(),
  
  // For form validation errors
  formError: () => haptic.error(),
  
  // For navigation
  navigate: () => haptic.selection(),
  
  // For button presses
  buttonPress: () => haptic.light(),
  
  // For important actions
  importantAction: () => haptic.medium(),
  
  // For destructive actions
  destructiveAction: () => haptic.warning(),
  
  // For long press gestures
  longPress: () => haptic.custom([0, 50, 100]),
  
  // For swipe gestures
  swipe: () => haptic.light(),
  
  // For pull to refresh
  pullToRefresh: () => haptic.custom([50, 100, 50]),
  
  // For notifications
  notification: () => haptic.notification(),
  
  // For achievements or completions
  achievement: () => haptic.custom([100, 50, 100, 50, 100]),
}

// Context for haptic settings
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface HapticSettings {
  enabled: boolean
  intensity: 'light' | 'medium' | 'heavy'
}

interface HapticContextType {
  settings: HapticSettings
  updateSettings: (settings: Partial<HapticSettings>) => void
  isSupported: boolean
}

const HapticContext = createContext<HapticContextType | undefined>(undefined)

export function HapticProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HapticSettings>({
    enabled: true,
    intensity: 'medium',
  })

  const capabilities = getMobileCapabilities()
  const isSupported = capabilities?.hasVibrationSupport || false

  const updateSettings = (newSettings: Partial<HapticSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    
    // Save to localStorage
    localStorage.setItem('haptic-settings', JSON.stringify({ ...settings, ...newSettings }))
  }
  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('haptic-settings')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        setSettings(parsedSettings)
      } catch (error) {
        console.warn('Failed to load haptic settings:', error)
      }
    }
  }, [])

  return (
    <HapticContext.Provider value={{ settings, updateSettings, isSupported }}>
      {children}
    </HapticContext.Provider>
  )
}

export function useHapticSettings() {
  const context = useContext(HapticContext)
  if (context === undefined) {
    throw new Error('useHapticSettings must be used within a HapticProvider')
  }
  return context
}
