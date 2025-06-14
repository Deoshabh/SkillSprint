
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import type { UserProfile, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Save, Briefcase, ShieldCheck, Settings, BarChartBig, SendHorizonal, Wand2, Sparkles } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link'; 

export default function UserManagementPage() {
  const { user: currentUser, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setSelectedRole(currentUser.role);
    }
  }, [currentUser]);

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) {
      toast({ title: "Error", description: "No user or role selected.", variant: "destructive" });
      return;
    }
    if (selectedUser.id !== currentUser?.id) {
      toast({ title: "Error", description: "For this simulation, you can only manage your own role.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API call
      updateUserProfile({ role: selectedRole });
      toast({
        title: "Role Updated Successfully",
        description: `${selectedUser.name}'s role has been changed to ${selectedRole}. Changes may apply on next login/refresh.`,
      });
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }
  
  const usersToManage = selectedUser ? [selectedUser] : [];


  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Users className="h-10 w-10 mr-3 text-primary" />
          User Management
        </h1>
        <p className="text-xl text-muted-foreground">
          View and manage user roles on the platform. (Simulated: Manages current admin user's role)
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">User List</CardTitle>
          <CardDescription>
            Currently managing the role for: {currentUser.name} ({currentUser.email}).
            In a full system, this would list all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersToManage.length > 0 ? (
            usersToManage.map(user => (
              <form key={user.id} onSubmit={handleSaveChanges} className="space-y-6 border p-6 rounded-lg bg-muted/30">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`role-${user.id}`}>Current Role</Label>
                     <Input id={`current-role-${user.id}`} value={user.role || 'N/A'} readOnly disabled className="capitalize"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`role-select-${user.id}`}>Change Role To</Label>
                    <Select value={selectedRole} onValueChange={(value: UserRole) => handleRoleChange(value)}>
                      <SelectTrigger id={`role-select-${user.id}`}>
                        <SelectValue placeholder="Select new role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="educator">Educator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving || selectedRole === user.role}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Role Change
                  </Button>
                </div>
              </form>
            ))
          ) : (
            <p className="text-muted-foreground text-center">No user data available to manage.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                Admin Capabilities Overview
            </CardTitle>
            <CardDescription>Current and planned features for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Review and approve/reject courses. (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Manage published/rejected courses (Unpublish, Move to Draft). (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Edit content for any course on the platform using the Course Designer. (Implemented)</strong> <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Open Designer)</Link></li>
                 <li><strong className="text-foreground">Advanced AI-powered tools: (Implemented)</strong>
                    <ul className="list-disc pl-5">
                        <li>Syllabus & Full Module Structure Generation. <Link href="/admin/ai-course-generator" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                        <li>Module-level content suggestions (subtopics, tasks, videos) within Course Designer. <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Use in Designer)</Link></li>
                    </ul>
                </li>
                <li><strong className="text-foreground">Utilize AI tools to find and suggest updated content (AI Content Scout). (Implemented)</strong> <Link href="/admin/content-scout" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                <li><strong className="text-foreground">Set platform-wide limits (Initial: Limit visible, enforcement in place).</strong></li>
                <li><strong className="text-foreground">Manage user roles and permissions (Initial Simulation Implemented: Can change current admin's role).</strong> <Link href="/admin/user-management" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">View platform analytics and reports (Placeholder UI Implemented).</strong> <Link href="/admin/analytics" className="text-xs text-primary hover:underline ml-1">(View)</Link></li>
                <li><strong className="text-foreground">Broadcast messaging to user segments (Placeholder UI Implemented).</strong> <Link href="/admin/messaging" className="text-xs text-primary hover:underline ml-1">(Compose)</Link></li>
            </ul>
        </CardContent>
      </Card>

    </div>
  );
}

    