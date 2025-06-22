
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gem, Library, Settings, BarChart3, Zap, Users, ArrowRight, Brain, Palette, Mic, type LucideIcon } from 'lucide-react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';

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
    },
    {
      icon: BarChart3,
      title: "Progress Tracking & Gamification",
      description: "Monitor your achievements, earn points, and collect badges to stay motivated on your learning adventure.",
    },
    {
      icon: Brain, 
      title: "Diverse Learning Categories",
      description: "Explore topics from Full-Stack Development, DSA, DevOps, to English Fluency, Design, and Aptitude.",
    },
    {
      icon: Gem,
      title: "Dark & Light Modes",
      description: "Learn comfortably at any time of day with a seamless theme toggle for your preferred viewing experience.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-2" aria-label="SkillSprint Home">
            <Gem className="h-7 w-7 text-primary" aria-hidden="true" />
            <span className="font-bold text-2xl font-headline">SkillSprint</span>
          </Link>          <nav className="flex items-center space-x-2">
            <SignedOut>
              <SignInButton>
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button>Sign Up</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/[.07] via-background to-accent/[.07]">
          <div className="container mx-auto text-center px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Accelerate Your <span className="text-primary">Learning Journey</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
              SkillSprint is your adaptive learning co-pilot, designed to help you master new skills faster with AI-powered course generation, personalized plans, and engaging content.
            </p>            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <SignedOut>
                <SignUpButton>
                  <Button size="lg" className="w-full sm:w-auto text-lg py-7 px-8">
                    Get Started Free
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button size="lg" asChild className="w-full sm:w-auto text-lg py-7 px-8">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </SignedIn>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-lg py-7 px-8">
                <Link href="#features">
                  Explore Features <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why Choose SkillSprint?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to learn effectively and efficiently, supercharged by AI.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="rounded-xl border bg-card p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-start text-left">
                  <feature.icon className="h-10 w-10 text-primary mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-semibold mb-2 font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6 text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                    Ready to Sprint Towards Your Goals?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Join SkillSprint today and unlock a smarter way to learn.
                </p>                <div className="mt-8">
                    <SignedOut>
                      <SignUpButton>
                        <Button size="lg" className="text-lg py-7 px-10">
                          Start Your Free Trial Now
                        </Button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <Button size="lg" asChild className="text-lg py-7 px-10">
                        <Link href="/dashboard">Go to Dashboard</Link>
                      </Button>
                    </SignedIn>
                </div>
            </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto text-center text-muted-foreground text-sm px-4 md:px-6">
          &copy; {new Date().getFullYear()} SkillSprint. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
