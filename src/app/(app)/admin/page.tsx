"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPlatformAnalytics, type PlatformAnalytics } from '@/lib/advanced-data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users as UsersIcon, 
  BookOpen, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText, 
  Shield, 
  Zap,
  Calendar,
  Target,
  Activity,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getPlatformAnalytics();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAnalytics();
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading page" />
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

  const adminLinks = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      href: "/admin/user-management",
      icon: UsersIcon,
      stats: analytics ? `${analytics.overview.totalUsers} users` : "Loading...",
      color: "bg-blue-500"
    },
    {
      title: "Analytics & Reports",
      description: "View platform analytics and generate reports",
      href: "/admin/analytics",
      icon: BarChart3,
      stats: analytics ? `${analytics.overview.completionRate.toFixed(1)}% completion rate` : "Loading...",
      color: "bg-green-500"
    },
    {
      title: "Course Management",
      description: "Review and manage courses on the platform",
      href: "/admin/course-designer",
      icon: BookOpen,
      stats: analytics ? `${analytics.content.pendingReviews} pending reviews` : "Loading...",
      color: "bg-purple-500"
    },
    {
      title: "Broadcast Messaging",
      description: "Send messages to user segments",
      href: "/admin/messaging",
      icon: MessageSquare,
      stats: "Advanced targeting available",
      color: "bg-orange-500"
    },
    {
      title: "AI Course Generator",
      description: "Generate courses using AI assistance",
      href: "/admin/ai-course-generator",
      icon: Zap,
      stats: "AI-powered content creation",
      color: "bg-pink-500"
    },
    {
      title: "Content Scout",
      description: "AI-powered content discovery and suggestions",
      href: "/admin/content-scout",
      icon: Target,
      stats: "Smart content recommendations",
      color: "bg-teal-500"
    },
    {
      title: "Feedback Management",
      description: "Review and respond to user feedback",
      href: "/admin/feedback-management",
      icon: FileText,
      stats: "User feedback & support",
      color: "bg-yellow-500"
    },
    {
      title: "xAPI Analytics",
      description: "Advanced learning analytics and tracking",
      href: "/admin/xapi-analytics",
      icon: Activity,
      stats: "Learning experience data",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
            <Shield className="h-10 w-10 mr-3 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Welcome back, {currentUser.name}. Manage your SkillSprint platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">+{analytics.userGrowth.newUsersThisMonth}</span>
                    <span className="text-muted-foreground">this month</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published Courses</p>
                  <p className="text-3xl font-bold">{analytics.overview.publishedCourses}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-500">{analytics.content.pendingReviews}</span>
                    <span className="text-muted-foreground">pending review</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">{analytics.overview.completionRate.toFixed(1)}%</p>
                  <Progress value={analytics.overview.completionRate} className="mt-2" />
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Courses Completed</p>
                  <p className="text-3xl font-bold">{analytics.learning.coursesCompletedThisMonth}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">+{analytics.learning.coursesCompletedThisWeek}</span>
                    <span className="text-muted-foreground">this week</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {adminLinks.map((link) => (
          <Card key={link.href} className="group hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Link href={link.href} className="block">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 ${link.color} rounded-lg flex items-center justify-center`}>
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {link.stats}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users Today</span>
                  <Badge variant="secondary">{analytics.userGrowth.newUsersToday}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users This Week</span>
                  <Badge variant="secondary">{analytics.userGrowth.newUsersThisWeek}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users This Month</span>
                  <Badge variant="secondary">{analytics.userGrowth.newUsersThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Growth Rate</span>
                  <div className="flex items-center gap-1">
                    {analytics.userGrowth.growthRate > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={analytics.userGrowth.growthRate > 0 ? "default" : "destructive"}>
                      {analytics.userGrowth.growthRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="space-y-3">
                {analytics.content.topPerformingCourses.slice(0, 4).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{course.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {course.enrollments} enrollments
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {course.completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              <span className="text-sm">Database: Operational</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              <span className="text-sm">Analytics: Active</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              <span className="text-sm">User Management: Online</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
