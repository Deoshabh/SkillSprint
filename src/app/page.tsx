import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { Library, Settings, BarChart3, Zap, Users, ArrowRight, Brain, Palette, Mic, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SkillSprint - AI-Powered Learning Platform | Start Your Journey',
  description: 'Join SkillSprint, the leading AI-powered learning platform. Access personalized courses, track progress, and accelerate your professional development with interactive tools.',
  keywords: ['online learning platform', 'AI education', 'skill development', 'personalized learning', 'professional development', 'course platform'],
  openGraph: {
    title: 'SkillSprint - AI-Powered Learning Platform',
    description: 'Join thousands of learners accelerating their skills with personalized AI-powered courses.',
    type: 'website',
    images: ['/logo.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillSprint - AI-Powered Learning Platform',
    description: 'Join thousands of learners accelerating their skills with personalized AI-powered courses.',
  },
  alternates: {
    canonical: '/',
  },
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function PublicHomePage() {
  const features: Feature[] = [
    {
      icon: Library,
      title: "Pre-built & Custom Courses",
      description: "Dive into expert-crafted courses or design your own unique learning paths tailored to your specific goals.",
    },
    {
      icon: Settings,
      title: "AI-Powered Course Designer",
      description: "Leverage AI to automatically generate course syllabi, module content, and quizzes, saving you time and effort.",
    },
    {
      icon: Zap,
      title: "Personalized Daily Sprints",
      description: "Stay on track with a personalized daily plan, guiding you through modules and tasks to maximize learning.",
    },    {
      icon: BarChart3,
      title: "Progress Tracking & Analytics",
      description: "Monitor your learning journey with detailed progress tracking, performance insights, and comprehensive analytics.",
    },
    {
      icon: Brain, 
      title: "Diverse Learning Categories",
      description: "Explore topics from Full-Stack Development, DSA, DevOps, to English Fluency, Design, and Aptitude.",
    },
    {
      icon: Palette,
      title: "Dark & Light Modes",
      description: "Learn comfortably at any time of day with a seamless theme toggle for your preferred viewing experience.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-3 transition-all duration-200 hover:opacity-80" aria-label="SkillSprint Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-2xl font-headline gradient-text">SkillSprint</span>
          </Link>
          <nav className="flex items-center space-x-3">
            <Button variant="ghost" asChild className="hover-lift">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="default" asChild className="hover-lift shadow-glow">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/[.07] via-background to-accent/[.07] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
          
          <div className="container mx-auto text-center px-4 md:px-6 relative">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline mb-6">
                Accelerate Your <span className="gradient-text">Learning Journey</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
                SkillSprint is your adaptive learning co-pilot, designed to help you master new skills faster with AI-powered course generation, personalized plans, and engaging content.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                <Button size="lg" variant="default" asChild className="w-full sm:w-auto hover-lift shadow-glow">
                  <Link href="/signup" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto hover-lift">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
            <div className="text-center animate-slide-up">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline gradient-text">Why Choose SkillSprint?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to learn effectively and efficiently, supercharged by AI.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="card-enhanced hover:shadow-glow animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="h-12 w-12 text-primary mb-4 p-2 rounded-lg bg-primary/10" aria-hidden="true" />
                  <h3 className="text-xl font-semibold mb-3 font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 glass">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline gradient-text mb-4">
                Ready to Sprint Towards Your Goals?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                Join SkillSprint today and unlock a smarter way to learn with AI-powered courses and personalized learning paths.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="default" asChild className="hover-lift shadow-glow">
                  <Link href="/signup" className="flex items-center gap-2">
                    Start Learning Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="hover-lift">
                  <Link href="/login">Already have an account?</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-muted/30 py-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-xl gradient-text">SkillSprint</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} SkillSprint. Accelerating learning through AI-powered education.
          </p>
        </div>
      </footer>
    </div>
  );
}
