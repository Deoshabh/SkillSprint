
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from '@clerk/nextjs';
import { CourseProvider } from '@/lib/course-store';
import { XAPIProvider } from '@/contexts/xapi-context';

export const metadata: Metadata = {
  title: 'SkillSprint',
  description: 'Accelerate Your Learning Journey',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  // Get Clerk publishable key and handle build-time scenarios
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isBuildTime = !publishableKey || 
    publishableKey === 'pk_build_time_placeholder' ||
    publishableKey === 'your_clerk_publishable_key' ||
    publishableKey.includes('c3BlZWR5LWNsYW0tNzAuY2xlcmsuYWNjb3VudHMuZGV2') ||
    process.env.NODE_ENV === 'production' && process.env.RUNTIME === 'build';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        {isBuildTime ? (
          // During build time, render without Clerk
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CourseProvider>
              <XAPIProvider>
                {children}
                <Toaster />
              </XAPIProvider>
            </CourseProvider>
          </ThemeProvider>
        ) : (
          // During runtime, render with Clerk
          <ClerkProvider publishableKey={publishableKey!}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <CourseProvider>
                <XAPIProvider>
                  {children}
                  <Toaster />
                </XAPIProvider>
              </CourseProvider>
            </ThemeProvider>
          </ClerkProvider>
        )}
      </body>
    </html>
  );
}
