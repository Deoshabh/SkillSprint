
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
import { BookOpen, CalendarDays, BarChart3, Trophy, Settings, ShieldCheck, Gem, LayoutDashboard, UserCircle2, FilePlus2, SquarePen, Wand2, Users, BarChartBig, SendHorizonal, Sparkles, MessageSquarePlus, Archive, Brain } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { FloatingChatbot } from '@/components/chatbot/floating-chatbot';

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Create Course', href: '/course-designer', icon: FilePlus2 },
  { title: 'Notes & Draw', href: '/notes-and-draw', icon: SquarePen },
  { title: 'Daily Planner', href: '/planner', icon: CalendarDays },
  { title: 'Progress', href: '/progress', icon: BarChart3 },
  { title: 'Achievements', href: '/gamification', icon: Trophy },
];

const accountNavItems: NavItem[] = [
  { title: 'Profile', href: '/profile', icon: UserCircle2 },
  { title: 'Submit Feedback', href: '/feedback', icon: MessageSquarePlus },
  // { title: 'Settings', href: '/settings', icon: Settings }, // Example for future
];

const adminNavItems: NavItem[] = [
   { title: 'Course Moderation', href: '/admin/course-designer', icon: ShieldCheck }, 
   { title: 'AI Course Generator', href: '/admin/ai-course-generator', icon: Sparkles },
   { title: 'AI Course Designer v2', href: '/admin/ai-course-designer-v2', icon: Brain, label: 'New' },
   { title: 'AI Content Scout', href: '/admin/content-scout', icon: Wand2 },
   { title: 'User Management', href: '/admin/user-management', icon: Users },
   { title: 'Analytics', href: '/admin/analytics', icon: BarChartBig },
   { title: 'Messaging', href: '/admin/messaging', icon: SendHorizonal },
   { title: 'Feedback Inbox', href: '/admin/feedback-management', icon: Archive },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  
  // Handle build time or when Clerk is not loaded
  if (!isLoaded) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    );
  }
  
  // For now, we'll assume any authenticated user is a regular user
  // You can extend this by adding custom metadata to Clerk user profiles
  // or using organizations/roles in Clerk
  const isAdmin = user?.unsafeMetadata?.role === 'admin';

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
            )}            {isAdmin && ( 
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
        {user && <FloatingChatbot />} 
      </SidebarInset>
    </SidebarProvider>
  );
}
