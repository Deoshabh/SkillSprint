
"use client";

import Link from 'next/link';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, ListRestart, BookOpen, Loader2 } from 'lucide-react';
import { useCourseStore } from '@/lib/course-store';
import type { Course } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export default function CoursesPage() {
  const { courses: allCourses } = useCourseStore();
  
  // Ensure allCourses is always an array with additional safety checks
  const safeAllCourses = useMemo(() => {
    if (!allCourses || typeof allCourses !== 'object') return [];
    if (!Array.isArray(allCourses)) return [];
    return allCourses;
  }, [allCourses]);
  
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('lastModified');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);  // Get categories from existing visible courses, or use default categories if none exist
  const existingCategories = Array.from(new Set(safeAllCourses.map((course: Course) => course.category)));
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

  // Function to fetch courses from the API
  const fetchCourses = useCallback(async (page: number = 1, resetCourses: boolean = true) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy: sortBy,
        sortOrder: 'desc'
      });

      if (debouncedSearchTerm) {
        searchParams.append('search', debouncedSearchTerm);
      }
      
      if (selectedCategory && selectedCategory !== 'all') {
        searchParams.append('category', selectedCategory);
      }

      const response = await fetch(`/api/courses?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      if (resetCourses || page === 1) {
        setCourses(data.courses || []);
      } else {
        setCourses(prev => [...prev, ...(data.courses || [])]);
      }
      
      setTotalPages(data.totalPages || 1);
      setHasNextPage(data.hasNextPage || false);
      setCurrentPage(page);    } catch (error) {
      console.error('Error fetching courses:', error);      // Fallback to local courses if API fails
      const filteredCourses = safeAllCourses.filter(course => 
        course.visibility === 'shared' || 
        course.visibility === 'public' || 
        course.status === 'published'
      );
      setCourses(filteredCourses);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedCategory, sortBy, safeAllCourses]);
  // Effect to fetch courses when search/filter parameters change
  useEffect(() => {
    setCurrentPage(1);
    fetchCourses(1, true);
  }, [debouncedSearchTerm, selectedCategory, sortBy, fetchCourses]);

  // Load initial courses only once
  useEffect(() => {
    fetchCourses(1, true);
  }, [fetchCourses]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      fetchCourses(currentPage + 1, false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Course Catalog</h1>
        <p className="text-xl text-muted-foreground">
          Explore our wide range of courses and start your learning journey.
        </p>
      </header>      <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10 w-full" 
              aria-label="Search courses"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by category">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Sort by">
                <ListRestart className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastModified">Latest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="enrollmentCount">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && courses.length === 0 ? (
          // Show loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg h-48 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : courses.length > 0 ? (
          courses.map((course: Course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-4">No Courses Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' 
                ? "No courses match your search criteria. Try adjusting your filters or search terms."
                : "There are no courses available yet. Be the first to create or import courses on the platform!"
              }
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
      
      {/* Load More button for pagination */}
      {hasNextPage && courses.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Courses'
            )}
          </Button>
        </div>
      )}
      
      {/* Results summary */}
      {courses.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
          {totalPages > 1 && (
            <> • Page {currentPage} of {totalPages}</>
          )}
        </div>
      )}
    </div>
  );
}
