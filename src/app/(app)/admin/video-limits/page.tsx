'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Video, Bot, Save } from 'lucide-react';

interface VideoLimits {
  maxCustomVideos: number;
  maxAiSearches: number;
}

export default function AdminVideoLimitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<VideoLimits>({
    maxCustomVideos: 3,
    maxAiSearches: 2
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCurrentLimits();
  }, []);

  const fetchCurrentLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/limits');
      
      if (response.ok) {
        const data = await response.json();
        setLimits(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch current limits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch current limits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limits),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video limits updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update limits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving limits:', error);
      toast({
        title: "Error",
        description: "Failed to update limits",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof VideoLimits, value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setLimits(prev => ({
        ...prev,
        [field]: numericValue
      }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Admin Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure video limits for all users across the platform
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Limits Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading current settings...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Custom Videos Limit */}
                    <div className="space-y-2">
                      <Label htmlFor="maxCustomVideos" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Custom Videos per Module
                      </Label>
                      <Input
                        id="maxCustomVideos"
                        type="number"
                        min="0"
                        max="20"
                        value={limits.maxCustomVideos}
                        onChange={(e) => handleInputChange('maxCustomVideos', e.target.value)}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum custom videos users can add per module (0-20)
                      </p>
                    </div>

                    {/* AI Searches Limit */}
                    <div className="space-y-2">
                      <Label htmlFor="maxAiSearches" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Searches per Module
                      </Label>
                      <Input
                        id="maxAiSearches"
                        type="number"
                        min="0"
                        max="10"
                        value={limits.maxAiSearches}
                        onChange={(e) => handleInputChange('maxAiSearches', e.target.value)}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum AI video searches per module (0-10)
                      </p>
                    </div>
                  </div>

                  {/* Current Settings Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Current Settings Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Custom Videos:</span>
                        <span className="ml-2 font-medium">{limits.maxCustomVideos} per module</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">AI Searches:</span>
                        <span className="ml-2 font-medium">{limits.maxAiSearches} per module</span>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-medium">About Video Limits</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom videos allow users to add their own YouTube videos/playlists to modules</li>
                  <li>• AI searches let users find relevant videos using AI-powered search</li>
                  <li>• Changes apply to all users and take effect immediately</li>
                  <li>• Recommended limits: 3 custom videos, 2 AI searches per module</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
