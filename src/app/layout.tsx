import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/context/auth-context';
import { WebVitals } from '@/components/web-vitals';
import { BottomNav } from '@/components/bottom-nav';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { MobileViewportManager } from '@/hooks/use-viewport';
import { MobileErrorBoundary } from '@/components/mobile-error-boundary';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'),
  title: {
    default: 'SkillSprint - AI-Powered Learning Platform | Accelerate Your Skills',
    template: '%s | SkillSprint'
  },
  description: 'Transform your learning with SkillSprint\'s AI-powered platform. Get personalized courses, interactive tools, progress tracking, and skill assessment. Start your learning journey today!',
  keywords: ['online learning', 'AI education', 'skill development', 'personalized learning', 'course platform', 'professional development', 'interactive learning', 'skill assessment'],
  authors: [{ name: 'SkillSprint Team' }],
  creator: 'SkillSprint',
  publisher: 'SkillSprint',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'SkillSprint - AI-Powered Learning Platform',
    description: 'Transform your learning with personalized courses, AI-powered tools, and interactive features. Join thousands of learners accelerating their skills.',
    siteName: 'SkillSprint',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'SkillSprint - AI-Powered Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillSprint - AI-Powered Learning Platform',
    description: 'Transform your learning with personalized courses and AI-powered tools. Start your skill development journey today!',
    images: ['/logo.webp'],
    creator: '@skillsprint',
  },
  verification: {
    google: 'your-google-verification-code',
    // Add other verification codes as needed
  },
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SkillSprint',
  },
  icons: {
    icon: [
      { url: '/logo.webp', type: 'image/webp' },
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.webp',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* SEO and Performance */}
        <link rel="preload" href="/logo.webp" as="image" type="image/webp" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "SkillSprint",
              "description": "AI-powered learning platform for skill development and professional growth",
              "url": process.env.NEXT_PUBLIC_BASE_URL || "https://skillsprint.com",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://skillsprint.com"}/logo.webp`
              },
              "sameAs": [
                "https://twitter.com/skillsprint",
                "https://linkedin.com/company/skillsprint",
                "https://github.com/skillsprint"
              ],
              "offers": {
                "@type": "Offer",
                "category": "Education"
              }
            })
          }}
        />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="SkillSprint" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SkillSprint" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logo.webp" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.webp" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.webp" />
        
        {/* Favicon Links */}
        <link rel="icon" type="image/webp" href="/logo.webp" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Service Worker Registration with Ad Blocking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  })
                    .then(function(registration) {
                      console.log('🚀 [SW] Service Worker registered successfully');
                      console.log('🛡️ [SW] Ad blocking and caching enabled');
                      
                      // Check for updates
                      registration.addEventListener('updatefound', () => {
                        console.log('🔄 [SW] Service Worker update found');
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('✨ [SW] New version available - reload to update');
                            }
                          });
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.warn('⚠️ [SW] Service Worker registration failed:', registrationError);
                      // Don't block the app if SW registration fails
                    });
                    
                  // Listen for service worker messages with error handling
                  try {
                    navigator.serviceWorker.addEventListener('message', (event) => {
                      try {
                        const { type, payload } = event.data || {};
                        if (type === 'AD_BLOCKED') {
                          console.log('🚫 [AD-BLOCK]', payload.url);
                        }
                      } catch (messageError) {
                        console.warn('⚠️ [SW] Message handling error:', messageError);
                      }
                    });
                  } catch (listenerError) {
                    console.warn('⚠️ [SW] Event listener setup error:', listenerError);
                  }
                });
              } else {
                console.log('❌ Service Worker not supported');
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <MobileErrorBoundary>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <MobileViewportManager />
              <div className="min-h-screen pb-16 md:pb-0" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
                {children}
              </div>
              <BottomNav />
              <Toaster />
              <WebVitals />
              <PWAInstallPrompt />
            </ThemeProvider>
          </AuthProvider>
        </MobileErrorBoundary>
      </body>
    </html>
  );
}
