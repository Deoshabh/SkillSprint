
"use client";

import Link from 'next/link';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, ListRestart, BookOpen } from 'lucide-react';
import { useCourseStore } from '@/lib/course-store';
import type { Course } from '@/lib/types';

export default function CoursesPage() {
  const { courses: allCourses } = useCourseStore();
  // Filter to only show visible courses (shared, public, or published)
  const courses = allCourses.filter(course => 
    course.visibility === 'shared' || 
    course.visibility === 'public' || 
    course.status === 'published'
  );
  // Get categories from existing visible courses, or use default categories if none exist
  const existingCategories = Array.from(new Set(courses.map((course: Course) => course.category)));
  const defaultCategories: string[] = [
    'Web Development',
    'Mobile Development', 
    'Data Science',
    'Machine Learning',
    'AI & Robotics',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'UI/UX Design',
    'Digital Marketing',
    'Business',
    'Language Learning',
    'Photography',
    'Music Production',
    'Creative Writing',
    'Finance',
    'Health & Fitness',
    'Cooking',
    'Art & Craft',
    'Personal Development'
  ];
  const categories: string[] = existingCategories.length > 0 ? existingCategories as string[] : defaultCategories;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Course Catalog</h1>
        <p className="text-xl text-muted-foreground">
          Explore our wide range of courses and start your learning journey.
        </p>
      </header>

      <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search courses..." className="pl-10 w-full" aria-label="Search courses" />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Select>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by category">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>                {categories.map((category: string) => (
                  <SelectItem key={category} value={category.toLowerCase().replace(' ', '-')}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Sort by">
                <ListRestart className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.length > 0 ? (
          courses.map((course: Course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-4">No Courses Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              There are no courses available yet. Be the first to create or import courses on the platform!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/course-designer">Create a Course</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/course-designer">Import Courses</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Load More button removed as it's a placeholder for now 
      <div className="flex justify-center mt-8">
        <Button variant="outline" size="lg">Load More Courses</Button>
      </div>
      */}
    </div>
  );
}
