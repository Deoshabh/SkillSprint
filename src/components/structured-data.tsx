interface CourseStructuredDataProps {
  course: {
    title: string
    description: string
    category: string
    imageUrl?: string
    instructor?: string
    duration?: string
    level?: string
    price?: number
    rating?: number
    enrollmentCount?: number
  }
}

export function CourseStructuredData({ course }: CourseStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'
  
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "SkillSprint",
      "url": baseUrl
    },    "courseCode": course.category,
    "educationalLevel": course.level || "Beginner to Advanced",
    "timeRequired": course.duration,
    "image": course.imageUrl || `${baseUrl}/logo.webp`,
    "offers": course.price ? {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    } : {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }

  if (course.rating) {
    structuredData["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": course.rating,
      "ratingCount": course.enrollmentCount || 1
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

interface BreadcrumbProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbStructuredData({ items }: BreadcrumbProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

interface FAQProps {
  faqs: Array<{
    question: string
    answer: string
  }>
}

export function FAQStructuredData({ faqs }: FAQProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SkillSprint",
    "url": baseUrl,
    "description": "AI-powered learning platform for skill development and professional growth",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/courses?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
