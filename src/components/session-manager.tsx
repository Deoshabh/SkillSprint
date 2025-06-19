"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionManagerProps {
  children: React.ReactNode;
  warningTimeMinutes?: number; // Show warning X minutes before expiry
  sessionTimeoutMinutes?: number; // Total session timeout
}

export function SessionManager({ 
  children, 
  warningTimeMinutes = 5,
  sessionTimeoutMinutes = 30 
}: SessionManagerProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Calculate session expiry
  const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
  const warningTimeMs = warningTimeMinutes * 60 * 1000;

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsWarningOpen(false);
  }, []);

  // Activity event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const throttledUpdateActivity = throttle(updateActivity, 30000); // Throttle to once per 30 seconds

    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
    };
  }, [updateActivity]);

  // Session timeout logic
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilWarning = sessionTimeoutMs - warningTimeMs - timeSinceActivity;
      const timeUntilExpiry = sessionTimeoutMs - timeSinceActivity;

      if (timeUntilExpiry <= 0) {
        // Session expired - auto logout
        handleSessionExpired();
      } else if (timeUntilWarning <= 0 && !isWarningOpen) {
        // Show warning
        setTimeLeft(Math.ceil(timeUntilExpiry / 1000));
        setIsWarningOpen(true);
      }
    };

    const interval = setInterval(checkSession, 1000); // Check every second
    return () => clearInterval(interval);
  }, [user, lastActivity, sessionTimeoutMs, warningTimeMs, isWarningOpen]);

  // Update countdown timer
  useEffect(() => {
    if (!isWarningOpen || !timeLeft) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          handleSessionExpired();
          return null;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarningOpen, timeLeft]);

  const handleSessionExpired = async () => {
    setIsWarningOpen(false);
    toast({
      title: "Session expired",
      description: "Your session has expired for security reasons. Please sign in again.",
      variant: "destructive",
    });
    
    try {
      await logout();
    } catch (error) {
      console.error('Auto-logout failed:', error);
      // Force redirect even if logout fails
      router.push('/login');
    }
  };

  const handleExtendSession = () => {
    updateActivity();
    setIsWarningOpen(false);
    toast({
      title: "Session extended",
      description: "Your session has been extended successfully.",
    });
  };

  const handleLogoutNow = async () => {
    setIsWarningOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Manual logout failed:', error);
      router.push('/login');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Session Warning</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>Your session will expire soon due to inactivity.</p>
              {timeLeft && (
                <div className="flex items-center space-x-2 text-lg font-mono">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600 font-bold">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground">remaining</span>
                </div>
              )}
              <p className="text-sm">
                Would you like to extend your session or sign out now?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleLogoutNow} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out Now
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExtendSession} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Extend Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Utility function to throttle activity updates
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Session status component for debugging/admin
export function SessionStatus() {
  const { user } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  if (!user || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const timeSinceActivity = Date.now() - lastActivity;
  const minutesSinceActivity = Math.floor(timeSinceActivity / 60000);

  return (
    <Card className="fixed bottom-4 left-4 w-64 text-xs opacity-75 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Session Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p>User: {user.email}</p>
        <p>Last Activity: {minutesSinceActivity}m ago</p>
        <p>Status: Active</p>
      </CardContent>
    </Card>
  );
}
