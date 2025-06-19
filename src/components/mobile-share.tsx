'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getMobileCapabilities } from '@/hooks/use-viewport'
import { Share2, Copy, MessageCircle, Mail, Link2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WebShareData {
  title: string
  text?: string
  url: string
}

interface MobileShareProps {
  data: WebShareData
  className?: string
  variant?: 'button' | 'icon'
}

export function MobileShare({ data, className, variant = 'button' }: MobileShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const capabilities = getMobileCapabilities()
  const hasNativeShare = capabilities?.hasWebShareSupport

  const handleNativeShare = async () => {
    if (!navigator.share || !hasNativeShare) return false

    setIsSharing(true)
    try {
      await navigator.share(data)
      toast({
        title: 'Shared successfully!',
        description: 'Content has been shared.',
      })
      return true
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        toast({
          title: 'Share failed',
          description: 'Could not share content. Please try again.',
          variant: 'destructive',
        })
      }
      return false
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.url)
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = data.url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
      })
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(data.title)
    const body = encodeURIComponent(`${data.text || ''}\n\n${data.url}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaSMS = () => {
    const text = encodeURIComponent(`${data.title}\n${data.url}`)
    window.open(`sms:?body=${text}`)
  }

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${data.title}\n${data.url}`)
    window.open(`https://wa.me/?text=${text}`)
  }

  // If native sharing is available, use it
  if (hasNativeShare) {
    const ShareButton = variant === 'icon' ? 
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNativeShare}
        disabled={isSharing}
        className={className}
      >
        <Share2 className="h-4 w-4" />
      </Button> :
      <Button
        variant="outline"
        onClick={handleNativeShare}
        disabled={isSharing}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {isSharing ? 'Sharing...' : 'Share'}
      </Button>

    return ShareButton
  }

  // Fallback to custom share menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className={className}>
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" className={className}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        
        {capabilities?.isAndroid && (
          <DropdownMenuItem onClick={shareViaSMS}>
            <MessageCircle className="h-4 w-4 mr-2" />
            SMS
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={shareViaWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility function to create share data
export function createShareData(
  title: string, 
  url?: string, 
  text?: string
): WebShareData {
  return {
    title,
    url: url || window.location.href,
    text,
  }
}

// Hook to check if sharing is supported
export function useWebShare() {
  const capabilities = getMobileCapabilities()
    return {
    canShare: (data: WebShareData) => {
      if (capabilities?.hasWebShareSupport && typeof navigator.share === 'function') {
        return navigator.canShare ? navigator.canShare(data) : true
      }
      return false
    },
    share: async (data: WebShareData) => {
      if (capabilities?.hasWebShareSupport && typeof navigator.share === 'function') {
        try {
          await navigator.share(data)
          return true
        } catch (error) {
          console.error('Share failed:', error)
          return false
        }
      }
      return false
    }
  }
}
