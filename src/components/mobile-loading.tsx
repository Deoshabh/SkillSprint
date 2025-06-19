'use client'

import { cn } from '@/lib/utils'
import { Loader2, Zap } from 'lucide-react'

interface MobileLoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullscreen?: boolean
}

export function MobileLoading({ 
  variant = 'spinner', 
  size = 'md', 
  text,
  className,
  fullscreen = false 
}: MobileLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-3',
    fullscreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
    !fullscreen && 'p-8',
    className
  )

  const renderSpinner = () => (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
  )

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className="h-4 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
    </div>
  )

  const renderPulse = () => (
    <div className="relative">
      <Zap className={cn('text-primary', sizeClasses[size])} />
      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
    </div>
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full animate-bounce',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )

  const renderLoader = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeleton()
      case 'pulse':
        return renderPulse()
      case 'dots':
        return renderDots()
      default:
        return renderSpinner()
    }
  }

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {text && (
        <p className={cn(
          'text-muted-foreground text-center animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Mobile-optimized skeleton components
export function MobileCardSkeleton() {
  return (
    <div className="mobile-card animate-pulse">
      <div className="h-48 bg-muted rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function MobileListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          <div className="w-6 h-6 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}

export function MobileProgressSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/2" />
      <div className="h-2 bg-muted rounded w-full" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  )
}
