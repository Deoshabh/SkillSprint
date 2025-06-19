import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Courses - SkillSprint Learning Platform',
  description: 'Explore our comprehensive catalog of AI-powered courses. Find programming, design, business, and technical skills courses tailored to your learning goals.',
  keywords: ['online courses', 'skill development', 'programming courses', 'design courses', 'business skills', 'AI-powered learning'],  openGraph: {
    title: 'Browse Courses - SkillSprint',
    description: 'Discover personalized courses designed to accelerate your professional development.',
    type: 'website',
    images: ['/logo.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Courses - SkillSprint',
    description: 'Discover personalized courses designed to accelerate your professional development.',
  },
  alternates: {
    canonical: '/courses',
  },
}

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "SkillSprint Courses",
            "description": "Browse our comprehensive catalog of AI-powered courses for professional development",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL}/courses`,
            "mainEntity": {
              "@type": "ItemList",
              "name": "Available Courses",
              "description": "AI-powered courses for skill development"
            }
          })
        }}
      />
      {children}
    </>
  )
}
