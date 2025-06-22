
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
import { CreditCard, LogOut, Settings, User, LogIn, UserPlus, UserCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser, SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export function UserNav() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton>
            <Button variant="ghost" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
            },
          }}
          userProfileProps={{
            appearance: {
              elements: {
                rootBox: "max-w-md",
              },
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
