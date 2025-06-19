"use client";


import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Shield, 
  Key, 
  Monitor, 
  Smartphone, 
  Globe, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  LogOut,
  Trash2
} from 'lucide-react';
import { PasswordStrengthMeter, isPasswordStrong } from '@/components/password-strength-meter';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function AccountSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/user/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!isPasswordStrong(newPassword)) {
      newErrors.newPassword = 'Password does not meet security requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been successfully updated.",
        });
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      } else {
        if (response.status === 401) {
          setErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          setErrors({ general: data.message || 'Failed to change password' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        toast({
          title: "Session ended",
          description: "The session has been successfully terminated.",
        });
      } else {
        toast({
          title: "Failed to end session",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out of all devices? You will need to sign in again.')) {
      return;
    }

    try {
      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });

      if (response.ok) {
        toast({
          title: "Signed out from all devices",
          description: "You have been signed out from all devices for security.",
        });
        
        // Logout current user
        await logout();
      } else {
        toast({
          title: "Failed to sign out",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (device.toLowerCase().includes('tablet')) {
      return <Monitor className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Security</h1>
        <p className="text-gray-600 mt-2">
          Manage your password, active sessions, and security settings.
        </p>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Sessions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {errors.general && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (errors.currentPassword) {
                          setErrors(prev => ({ ...prev, currentPassword: '' }));
                        }
                      }}
                      className={`pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors(prev => ({ ...prev, newPassword: '' }));
                        }
                      }}
                      className={`pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                  {newPassword && (
                    <div className="mt-2">
                      <PasswordStrengthMeter 
                        password={newPassword} 
                        showRequirements={true}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isChangingPassword || !isPasswordStrong(newPassword) || newPassword !== confirmPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices and browsers where you're currently signed in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No active sessions found.
                    </p>
                  ) : (
                    <>
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {getDeviceIcon(session.device)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{session.device}</h4>
                                {session.current && (
                                  <Badge variant="secondary">Current</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {session.browser} • {session.location}
                              </p>
                              <p className="text-sm text-gray-500">
                                Last active: {new Date(session.lastActive).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {!session.current && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogoutSession(session.id)}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Sign out
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t">
                        <Button
                          variant="destructive"
                          onClick={handleLogoutAllDevices}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sign out of all devices
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          This will sign you out of all devices including this one. 
                          You'll need to sign in again.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
