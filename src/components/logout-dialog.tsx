"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Monitor, Smartphone, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface LogoutDialogProps {
  children: React.ReactNode;
  showDeviceOptions?: boolean;
}

export function LogoutDialog({ children, showDeviceOptions = true }: LogoutDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoutAllDevices, setLogoutAllDevices] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      if (logoutAllDevices) {
        // First call API to invalidate all sessions
        const response = await fetch('/api/user/sessions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'logout_all_devices',
            reason: 'user_requested'
          }),
        });

        if (response.ok) {
          toast({
            title: "Signed out from all devices",
            description: "You have been securely signed out from all devices.",
          });
        } else {
          console.warn('Failed to logout from all devices, proceeding with current device logout');
        }
      }

      // Then perform normal logout
      await logout();
      
      toast({
        title: "Signed out successfully",
        description: logoutAllDevices 
          ? "You have been signed out from all devices." 
          : "You have been signed out from this device.",
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <LogOut className="h-5 w-5 text-muted-foreground" />
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to sign out of your SkillSprint account?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showDeviceOptions && (
          <div className="py-4">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Security Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start space-x-3">                  <Checkbox
                    id="logout-all"
                    checked={logoutAllDevices}
                    onCheckedChange={(checked) => setLogoutAllDevices(checked === true)}
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <label 
                      htmlFor="logout-all" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Sign out from all devices
                    </label>
                    <p className="text-xs text-muted-foreground">
                      This will sign you out from all computers, phones, and tablets where you're currently signed in.
                    </p>
                    <div className="flex items-center space-x-4 pt-1 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3" />
                        <span>Desktop</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Smartphone className="h-3 w-3" />
                        <span>Mobile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                {logoutAllDevices ? 'Sign out from all devices' : 'Sign out'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Quick logout button without confirmation
export function QuickLogoutButton({ className, variant = "ghost" }: { className?: string; variant?: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleQuickLogout = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: "Signing out...",
        description: "Please wait while we securely sign you out.",
      });
      
      await logout();
    } catch (error) {
      console.error('Quick logout error:', error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleQuickLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="ml-2">
        {isLoading ? 'Signing out...' : 'Sign out'}
      </span>
    </Button>
  );
}
