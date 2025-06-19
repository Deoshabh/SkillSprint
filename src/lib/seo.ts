import { Metadata } from 'next'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  noIndex?: boolean
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'
  
  return {
    title: config.title ? `${config.title} | SkillSprint` : 'SkillSprint - AI-Powered Learning Platform',
    description: config.description || 'Transform your learning with SkillSprint\'s AI-powered platform. Get personalized courses, interactive tools, and skill assessment.',
    keywords: config.keywords || ['online learning', 'AI education', 'skill development'],
    robots: config.noIndex ? 'noindex,nofollow' : 'index,follow',    openGraph: {
      title: config.title || 'SkillSprint - AI-Powered Learning Platform',
      description: config.description || 'Transform your learning with personalized courses and AI-powered tools.',
      type: 'website',
      url: config.canonical ? `${baseUrl}${config.canonical}` : baseUrl,
      images: [config.ogImage || '/logo.webp'],
      siteName: 'SkillSprint',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title || 'SkillSprint - AI-Powered Learning Platform',
      description: config.description || 'Transform your learning with personalized courses and AI-powered tools.',
      images: [config.ogImage || '/logo.webp'],
    },
    alternates: {
      canonical: config.canonical ? `${baseUrl}${config.canonical}` : baseUrl,
    },
  }
}

export function generateCourseMetadata(course: {
  title: string
  description: string
  category: string
  imageUrl?: string
  slug: string
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'
  
  return {
    title: `${course.title} - ${course.category} Course`,
    description: `Learn ${course.title} with our comprehensive ${course.category.toLowerCase()} course. ${course.description}`,
    keywords: [
      course.title.toLowerCase(),
      course.category.toLowerCase(),
      'online course',
      'skill development',
      'AI-powered learning'
    ],
    openGraph: {
      title: `${course.title} - ${course.category} Course | SkillSprint`,      description: course.description,
      type: 'article',
      url: `${baseUrl}/courses/${course.slug}`,      images: [course.imageUrl || '/logo.webp'],
      siteName: 'SkillSprint',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${course.title} - ${course.category} Course`,
      description: course.description,
      images: [course.imageUrl || '/logo.webp'],
    },
    alternates: {
      canonical: `/courses/${course.slug}`,
    },
  }
}

export const keywordMap = {
  // Primary keywords
  primary: [
    'online learning platform',
    'AI-powered education',
    'skill development platform',
    'personalized learning',
    'professional development courses'
  ],
  // Course categories
  programming: [
    'programming courses',
    'coding bootcamp',
    'software development training',
    'web development courses',
    'JavaScript courses',
    'Python courses',
    'React training'
  ],
  design: [
    'design courses',
    'UI/UX design training',
    'graphic design courses',
    'web design tutorials',
    'Figma courses',
    'Adobe training'
  ],
  business: [
    'business skills training',
    'leadership development',
    'project management courses',
    'marketing courses',
    'entrepreneurship training'
  ],
  data: [
    'data science courses',
    'machine learning training',
    'data analysis courses',
    'SQL courses',
    'data visualization'
  ]
}

export function getKeywordsForCategory(category: string): string[] {
  const categoryLower = category.toLowerCase()
  return keywordMap[categoryLower as keyof typeof keywordMap] || keywordMap.primary
}
