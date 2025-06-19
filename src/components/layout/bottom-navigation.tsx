"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, CalendarDays, BarChart3, UserCircle2, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutDialog } from '@/components/logout-dialog';

const bottomNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    title: 'Planner',
    href: '/planner',
    icon: CalendarDays,
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: BarChart3,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <nav className="flex items-center justify-around py-2 px-1 safe-area-pb">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors text-xs font-medium min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
              <span className="truncate text-[10px] leading-none">{item.title}</span>
            </Link>
          );
        })}
        
        {/* Profile with Dropdown Menu */}
        <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors text-xs font-medium min-w-0 flex-1 h-auto",
                (pathname === '/profile' || pathname.startsWith('/profile'))
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <UserCircle2 className={cn(
                "h-5 w-5 mb-1", 
                (pathname === '/profile' || pathname.startsWith('/profile')) && "text-primary"
              )} />
              <span className="truncate text-[10px] leading-none">Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="mb-2">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full">
                <User className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutDialog showDeviceOptions={true}>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive cursor-pointer w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </LogoutDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
