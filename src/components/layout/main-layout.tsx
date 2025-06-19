"use client";

import './sidebar-fix.css';
import React from 'react';
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
import { BottomNavigation } from './bottom-navigation';
import { SidebarBottomControls } from './sidebar-bottom-controls';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, CalendarDays, BarChart3, Settings, ShieldCheck, LayoutDashboard, UserCircle2, FilePlus2, SquarePen, Wand2, Users, BarChartBig, SendHorizonal, Sparkles, MessageSquarePlus, Archive, Brain } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { FloatingChatbot } from '@/components/chatbot/floating-chatbot'; 
import { SessionManager } from '@/components/session-manager';
import { ErrorBoundary } from '@/components/error-boundary';
import { useState, useEffect } from 'react';

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Create Course', href: '/course-designer', icon: FilePlus2 },
  { title: 'AI Import', href: '/ai-import', icon: Brain },
  { title: 'Notes & Draw', href: '/notes-and-draw', icon: SquarePen },
  { title: 'Daily Planner', href: '/planner', icon: CalendarDays },
  { title: 'Progress', href: '/progress', icon: BarChart3 },
];

const accountNavItems: NavItem[] = [
  { title: 'Profile', href: '/profile', icon: UserCircle2 },
  { title: 'Submit Feedback', href: '/feedback', icon: MessageSquarePlus },
  // { title: 'Settings', href: '/settings', icon: Settings }, // Example for future
];

const adminNavItems: NavItem[] = [
   { title: 'Course Moderation', href: '/admin/course-designer', icon: ShieldCheck }, 
   { title: 'AI Course Generator', href: '/admin/ai-course-generator', icon: Sparkles },
   { title: 'AI Content Scout', href: '/admin/content-scout', icon: Wand2 },
   { title: 'User Management', href: '/admin/user-management', icon: Users },
   { title: 'Analytics', href: '/admin/analytics', icon: BarChartBig },
   { title: 'Messaging', href: '/admin/messaging', icon: SendHorizonal },
   { title: 'Feedback Inbox', href: '/admin/feedback-management', icon: Archive },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Read sidebar state from cookie if available
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('sidebar_state='))
      ?.split('=')[1];
      
    if (cookieValue === 'false') {
      setSidebarOpen(false);
    }
  }, []);

  const LogoComponent = () => (
    <img 
      src="/logo.webp" 
      alt="SkillSprint Logo" 
      width={32} 
      height={32} 
      className="rounded-lg flex-shrink-0"
      style={{ width: '32px', height: '32px' }}
    />
  );

  const MobileLogoComponent = () => (
    <img 
      src="/logo.webp" 
      alt="SkillSprint Logo" 
      width={24} 
      height={24} 
      className="rounded-lg flex-shrink-0"
      style={{ width: '24px', height: '24px' }}
    />
  );
  return (
    <ErrorBoundary>      <SessionManager warningTimeMinutes={5} sessionTimeoutMinutes={30}>        <SidebarProvider defaultOpen={sidebarOpen} open={sidebarOpen} onOpenChange={setSidebarOpen}>
          {/* Desktop Sidebar */}
          <Sidebar variant="sidebar" collapsible="icon" side="left" className="hidden md:flex border-r border-border/50 backdrop-blur-xl bg-background/80 z-50">            <SidebarHeader className="sidebar-header p-6 items-center border-b border-border/50 transition-all duration-300">
              <Link href="/" className="flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                <LogoComponent />
                <div className="sidebar-logo-text transition-opacity duration-300">
                  <h1 className="text-2xl font-bold font-headline gradient-text">
                    SkillSprint
                  </h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
                </div>
              </Link>
            </SidebarHeader>            <SidebarContent className="px-4 py-6">
              <ScrollArea className="h-full">
                <div className="space-y-8">
                  <div className="sidebar-section" data-section="learning">
                    <h3 className="mb-4 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
                      Learning
                    </h3>
                    <SidebarNav items={mainNavItems} />
                  </div>
                
                  {mounted && user && (
                    <>
                      <div className="sidebar-section-divider">
                        <div className="mx-2 h-px bg-border/50" />
                      </div>
                      
                      <div className="sidebar-section" data-section="account">
                        <h3 className="mb-4 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
                          Account
                        </h3>
                        <SidebarNav items={accountNavItems} />
                      </div>                      {user.role === 'admin' && (
                        <div className="sidebar-section" data-section="admin">
                          <h3 className="mb-4 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
                            Administration
                          </h3>
                          <SidebarNav items={adminNavItems} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </SidebarContent>            <SidebarFooter className="p-4 border-t border-border/50">
              <div className="flex items-center justify-between transition-all duration-300 sidebar-footer-container">
                <div className="transition-all duration-300">
                  <SidebarBottomControls />
                </div>
                <div className="sidebar-collapse-button transition-all duration-300">
                  <SidebarTrigger className="sidebar-trigger hover:bg-primary/10 transition-all p-2 rounded-full border border-border/50 shadow-sm" />
                </div>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="w-full">
            {/* Mobile/Desktop Header */}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl transition-all duration-200 md:hidden">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:opacity-80">
                  <MobileLogoComponent />
                  <h1 className="text-lg font-bold gradient-text">SkillSprint</h1>
                </Link>
              </div>
              <UserNav />
            </header>

            {/* Main Content */}
            <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
              <div className="animate-fade-in p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
              </div>
            </main>

            {/* Floating Chatbot */}
            {mounted && user && <FloatingChatbot />}

            {/* Mobile Bottom Navigation */}
            <BottomNavigation />          </SidebarInset>
        </SidebarProvider>
      </SessionManager>
    </ErrorBoundary>
  );
}

