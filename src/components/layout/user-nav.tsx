"use client";


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { placeholderUserProfile } from '@/lib/placeholder-data';
import { CreditCard, LogOut, Settings, User, LogIn, UserPlus, UserCircle2, Shield, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context';
import { LogoutDialog } from '@/components/logout-dialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const profile = user || placeholderUserProfile; 
  
  // Only pass src if avatarUrl exists and is not empty
  const avatarSrc = 'avatarUrl' in profile && profile.avatarUrl && profile.avatarUrl.trim() !== '' ? profile.avatarUrl : undefined;
  
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
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200 focus-ring" 
            aria-label="Open user menu"
          >
            <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary/20 transition-all duration-200">
              <AvatarImage 
                src={avatarSrc} 
                alt={profile.name ? `${profile.name}'s avatar` : "User avatar"} 
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold border border-primary/10">
                {getInitials(profile.name || "User")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 glass" align="end" forceMount>
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                  {user.role && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs capitalize text-muted-foreground">
                        {user.role}
                      </span>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/security">
                    <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Account Security</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Billing</span>
                  <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Settings</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <LogoutDialog showDeviceOptions={true}>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Sign out</span>
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </LogoutDialog>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Sign in</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Create account</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
