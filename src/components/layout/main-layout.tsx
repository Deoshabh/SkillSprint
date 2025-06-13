
"use client";

import type { NavItem } from '@/lib/types';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, CalendarDays, BarChart3, Trophy, Settings, ShieldCheck, Gem, LayoutDashboard, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Daily Planner', href: '/planner', icon: CalendarDays },
  { title: 'Progress', href: '/progress', icon: BarChart3 },
  { title: 'Achievements', href: '/gamification', icon: Trophy },
];

const accountNavItems: NavItem[] = [
  { title: 'Profile', href: '/profile', icon: UserCircle2 },
  // { title: 'Settings', href: '/settings', icon: Settings }, // Example for future
];

const adminNavItems: NavItem[] = [
   { title: 'Course Designer', href: '/admin/course-designer', icon: Settings },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline group-data-[collapsible=icon]:hidden">
              SkillSprint
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            <SidebarNav items={mainNavItems} />
            
            {user && (
              <>
                <div className="my-2 px-4 group-data-[collapsible=icon]:px-2">
                  <hr className="border-sidebar-border group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-4/5" />
                </div>
                <p className="px-4 py-1 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Account</p>
                <SidebarNav items={accountNavItems} />
              </>
            )}

            {/* Placeholder for admin role check, for now always show admin items if user is logged in */}
            {user && ( 
              <>
                <div className="my-2 px-4 group-data-[collapsible=icon]:px-2">
                  <hr className="border-sidebar-border group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-4/5" />
                </div>
                 <p className="px-4 py-1 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Admin Tools</p>
                <SidebarNav items={adminNavItems} />
              </>
            )}
          </ScrollArea>
        </SidebarContent>
        {user && (
          <SidebarFooter className="p-4 mt-auto">
            <Button variant="outline" className="w-full group-data-[collapsible=icon]:hidden">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admin Panel
            </Button>
          </SidebarFooter>
        )}
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
