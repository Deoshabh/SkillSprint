'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  User,
  PlusCircle
} from 'lucide-react'

const bottomNavItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen
  },
  {
    title: 'Create',
    href: '/course-designer',
    icon: PlusCircle
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: BarChart3
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User
  }
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't show bottom nav on certain pages
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden mobile-safe">
      <div className="flex justify-around items-center py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href === '/dashboard' && pathname === '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors touch-manipulation btn-mobile min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
