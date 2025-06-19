"use client";

import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { placeholderUserProfile } from '@/lib/placeholder-data';
import { Loader2, MoonIcon, SunIcon, User, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutDialog } from '@/components/logout-dialog';
import Link from 'next/link';

export function SidebarBottomControls() {
  const { user, loading } = useAuth();
  const profile = user || placeholderUserProfile;
  const { setTheme, theme } = useTheme();
  
  // Only pass src if avatarUrl exists and is not empty
  const avatarSrc = 'avatarUrl' in profile && profile.avatarUrl && profile.avatarUrl.trim() !== '' 
    ? profile.avatarUrl 
    : undefined;
  
  // Generate initials for fallback
  const getInitials = (name: string) => {
    if (!name) return "U";
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };  return (
    <div className="sidebar-bottom-controls flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="sidebar-user-avatar relative h-8 w-8 p-0 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200"
            data-title={profile.name || "User"}
          >
            <Avatar 
              className="h-8 w-8 border border-border hover:border-primary/30 transition-all duration-200 sidebar-avatar"
            >
              <AvatarImage 
                src={avatarSrc} 
                alt={profile.name ? `${profile.name}'s avatar` : "User avatar"} 
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {getInitials(profile.name || "User")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="mb-2 w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
      
      <div className="sidebar-theme-toggle-container relative" data-title="Toggle theme">
        <Button 
          variant="ghost"
          size="icon"
          className="sidebar-theme-toggle h-8 w-8"
          onClick={toggleTheme}
        >
          <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
}
