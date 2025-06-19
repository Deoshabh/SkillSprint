'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { 
  Menu, 
  Home, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  User, 
  Settings,
  X,
  Brain,
  PlusCircle
} from 'lucide-react'

interface MobileNavProps {
  className?: string
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview of your learning progress'
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
    description: 'Browse and manage your courses'
  },
  {
    title: 'Course Designer',
    href: '/course-designer',
    icon: PlusCircle,
    description: 'Create and edit courses'
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: BarChart3,
    description: 'Track your learning analytics'
  },
  {
    title: 'Planner',
    href: '/planner',
    icon: Calendar,
    description: 'Schedule your study sessions'
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Manage your account settings'
  }
]

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden btn-mobile",
            className
          )}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 mobile-safe">
        <div className="px-6">
          <Link
            href="/"
            className="flex items-center space-x-2"
            onClick={() => setOpen(false)}
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">SkillSprint</span>
          </Link>
        </div>
        
        <div className="my-4 h-[calc(100vh-8rem)] overflow-auto pb-10 pl-6">
          <div className="flex flex-col space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-accent-foreground">
                      {item.description}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          
          <div className="mt-8 border-t pt-4">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="group flex items-center rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation"
            >
              <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col">
                <span>Settings</span>
                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground">
                  App preferences and configuration
                </span>
              </div>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
