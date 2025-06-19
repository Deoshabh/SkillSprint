'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if PWA is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    // Check if device is iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkInstalled()
    checkIOS()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has dismissed the prompt before
      const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedDate = hasBeenDismissed ? parseInt(hasBeenDismissed) : 0
      const daysSinceDismissal = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24)
      
      // Show prompt if not dismissed or dismissed more than 7 days ago
      if (!hasBeenDismissed || daysSinceDismissal > 7) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Auto-hide prompt after 30 seconds
    const timer = setTimeout(() => {
      setShowPrompt(false)
    }, 30000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isInstalled) return null

  // Show iOS-specific install instructions
  if (isIOS && showPrompt) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md md:bottom-4 md:left-auto md:right-4 md:w-96">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Install SkillSprint</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              className="h-6 w-6 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Add SkillSprint to your home screen for a better experience
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-xs">1</span>
              </div>
              <span>Tap the Share button in Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-xs">2</span>
              </div>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-xs">3</span>
              </div>
              <span>Tap "Add" to install the app</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show Android/Chrome install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md md:bottom-4 md:left-auto md:right-4 md:w-96">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Install SkillSprint</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              className="h-6 w-6 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Install the app for faster access and offline support
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              Not Now
            </Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            • Faster loading • Offline access • Native app experience
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
