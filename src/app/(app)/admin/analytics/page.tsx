
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, Users, BookOpen, TrendingUp, CheckCircle, Activity, ShieldCheck, Wand2, MessageSquareQuote, SendHorizonal } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import Link from 'next/link';

const placeholderAnalyticsData = {
  totalUsers: 12345,
  activeCourses: 150,
  completionRate: 65.7,
  popularCategories: [
    { name: 'Full-Stack', value: 400, fill: 'hsl(var(--chart-1))' },
    { name: 'AI Tools', value: 300, fill: 'hsl(var(--chart-2))' },
    { name: 'English', value: 200, fill: 'hsl(var(--chart-3))' },
    { name: 'Aptitude', value: 100, fill: 'hsl(var(--chart-4))' },
  ],
  userGrowth: [
    { month: "Jan", users: 65 },
    { month: "Feb", users: 59 },
    { month: "Mar", users: 80 },
    { month: "Apr", users: 81 },
    { month: "May", users: 56 },
    { month: "Jun", users: 55 },
    { month: "Jul", users: 40 },
  ],
};

const userGrowthChartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  users: {
    label: "Users",
  },
  "Full-Stack": {
    label: "Full-Stack",
    color: "hsl(var(--chart-1))",
  },
  "AI Tools": {
    label: "AI Tools",
    color: "hsl(var(--chart-2))",
  },
  English: {
    label: "English",
    color: "hsl(var(--chart-3))",
  },
  Aptitude: {
    label: "Aptitude",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;


export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <BarChartBig className="h-10 w-10 mr-3 text-primary" />
          Platform Analytics & Reports
        </h1>
        <p className="text-xl text-muted-foreground">
          Overview of platform usage and performance. (Placeholder Data)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{placeholderAnalyticsData.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{placeholderAnalyticsData.activeCourses}</div>
            <p className="text-xs text-muted-foreground">+10 new courses this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{placeholderAnalyticsData.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Across all enrolled users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>User Growth (Monthly)</CardTitle>
            <CardDescription>New user registrations per month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={userGrowthChartConfig} className="w-full h-full">
              <BarChart data={placeholderAnalyticsData.userGrowth} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/>Popular Categories</CardTitle>
            <CardDescription>Distribution of enrollments by course category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ChartContainer
                config={categoryChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={placeholderAnalyticsData.popularCategories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                     {placeholderAnalyticsData.popularCategories.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    ))}
                  </Pie>
                   <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                Feature Status
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                This analytics page currently displays placeholder data. Full data integration and advanced reporting features are planned for future development.
            </p>
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
                <li><strong className="text-foreground">Advanced AI-powered tools within the Course Designer (Syllabus & Full Module Structure Generation, Content Suggestions) for admins. (Implemented)</strong> <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Use in Designer)</Link></li>
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
