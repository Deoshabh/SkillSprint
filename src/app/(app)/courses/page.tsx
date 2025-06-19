
'use client';

import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, ListRestart, Plus, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { Course } from '@/lib/types';
import { ImportDialog } from '@/components/enhanced-import-dialog';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

interface CourseProgress {
  completedModules: string[];
  totalModules: number;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<{[courseId: string]: CourseProgress}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [courseFilter, setCourseFilter] = useState<'all' | 'public' | 'my-courses'>('public');
  const [userHasCourses, setUserHasCourses] = useState(false);

  useEffect(() => {
    fetchCourses();
    
    // Listen for storage events to refresh when courses are imported/saved
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'courseImported' || e.key === 'courseSaved') {
        console.log('Storage event detected, refreshing courses:', e.key);
        fetchCourses();
        localStorage.removeItem('courseImported');
        localStorage.removeItem('courseSaved');
      }
    };

    // Listen for focus events to refresh when returning to page
    const handleFocus = () => {
      console.log('Page focus detected, refreshing courses');
      fetchCourses();
    };

    // Listen for custom events for immediate updates
    const handleCourseUpdate = () => {
      console.log('Course update event detected, refreshing courses');
      fetchCourses();
    };

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visibility changed to visible, refreshing courses');
        fetchCourses();
      }
    };

    // Check localStorage on mount for any pending updates
    if (localStorage.getItem('courseImported') || localStorage.getItem('courseSaved')) {
      console.log('Pending course updates found, refreshing courses');
      fetchCourses();
      localStorage.removeItem('courseImported');
      localStorage.removeItem('courseSaved');
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('courseUpdated', handleCourseUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [courseFilter, user]); // Added courseFilter as dependency

  useEffect(() => {
    if (user && courses.length > 0) {
      fetchUserProgress();
    }
  }, [user, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Add cache-busting query parameter to force fresh data
      const timestamp = new Date().getTime();
      
      let url = '/api/courses?';
      if (courseFilter === 'public') {
        url += `status=published&t=${timestamp}`;
      } else if (courseFilter === 'my-courses' && user) {
        url += `authorId=${user.id}&t=${timestamp}`;
      } else {
        // All courses: published + user's own courses
        url += `status=published&t=${timestamp}`;
      }
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        let fetchedCourses = data.courses || [];
        
        // If showing all courses, also fetch user's personal courses
        if (courseFilter === 'all' && user) {
          try {
            const userCoursesResponse = await fetch(`/api/courses?authorId=${user.id}&t=${timestamp}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            });
            
            if (userCoursesResponse.ok) {
              const userCoursesData = await userCoursesResponse.json();
              const userCourses = userCoursesData.courses || [];
              
              // Merge and deduplicate courses
              const allCourses = [...fetchedCourses];
              userCourses.forEach((userCourse: Course) => {
                if (!allCourses.find(course => course.id === userCourse.id)) {
                  allCourses.push(userCourse);
                }
              });
              fetchedCourses = allCourses;
            }
          } catch (error) {
            console.error('Failed to fetch user courses:', error);
          }
        }
        
        setCourses(fetchedCourses);
        console.log(`Fetched ${fetchedCourses.length} courses for filter: ${courseFilter}`);
        
        // Check if user has any courses
        if (user && Array.isArray(fetchedCourses)) {
          const userCourses = fetchedCourses.filter((course: Course) => course && course.authorId === user.id);
          const hasUserCourses = userCourses.length > 0;
          setUserHasCourses(hasUserCourses);
          console.log(`User has ${userCourses.length} courses`);
        }
        
        // Force a re-render to ensure tabs update correctly
        setTimeout(() => {
          const event = new CustomEvent('coursesRefreshed', { detail: { count: fetchedCourses.length } });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const responseData = await response.json();
        
        // The API returns data in responseData.data, not responseData.progress
        if (responseData.success && responseData.data) {
          const progressData = responseData.data;
          
          // Calculate progress for each course
          const courseProgressMap: {[courseId: string]: CourseProgress} = {};
          
          if (Array.isArray(courses)) {
            courses.forEach(course => {
              if (course && (course.id || (course as any)._id)) {
                const courseId = (course as any)._id || course.id;
                const completedModules = progressData?.completedModules?.[courseId] || [];
                const totalModules = course.modules?.length || 0;
                
                courseProgressMap[courseId] = {
                  completedModules,
                  totalModules
                };
              }
            });
          }
          
          setUserProgress(courseProgressMap);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  };

  // Filter and sort courses - ensure courses is always an array
  const filteredCourses = (Array.isArray(courses) ? courses : [])
    .filter(course => {
      // Safety check for course object
      if (!course) return false;
      
      const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             (course.category && typeof course.category === 'string' && 
                              course.category.toLowerCase().replace(' ', '-') === selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0);
        case 'rating':
          const aRating = a.ratings?.length ? 
            a.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / a.ratings.length : 0;
          const bRating = b.ratings?.length ? 
            b.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / b.ratings.length : 0;
          return bRating - aRating;
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const categories = Array.from(new Set((Array.isArray(courses) ? courses : [])
    .map(course => course?.category)
    .filter(category => category && typeof category === 'string' && category.trim() !== '')));

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Course Catalog</h1>
          <p className="text-xl text-muted-foreground">Loading courses...</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Course Catalog</h1>
          <p className="text-xl text-muted-foreground">
            Discover courses from the community and explore your personal learning collection.
          </p>
        </div>
        
        {/* Course Type Filter */}
        {user && (
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={courseFilter === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCourseFilter('public')}
              >
                Public Courses
              </Button>
              <Button
                variant={courseFilter === 'my-courses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCourseFilter('my-courses')}
              >
                My Courses
              </Button>
              <Button
                variant={courseFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCourseFilter('all')}
              >
                All Courses
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/course-designer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
              <ImportDialog 
                trigger={
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Course
                  </Button>
                }
                onImportComplete={() => {
                  toast({
                    title: "Import Complete",
                    description: "Course has been imported successfully.",
                  });
                  
                  // Trigger refresh immediately
                  fetchCourses();
                  
                  // Also set localStorage for other components
                  localStorage.setItem('courseImported', 'true');
                  
                  // Dispatch custom event
                  window.dispatchEvent(new CustomEvent('courseUpdated'));
                }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10 w-full" 
              aria-label="Search courses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by category">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category?.toLowerCase().replace(' ', '-') || ''}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map(course => {
          const courseId = (course as any)._id || course.id;
          // Add safety check for course object
          if (!course || !course.id) {
            console.warn('Invalid course object:', course);
            return null;
          }
          return (
            <CourseCard 
              key={course.id} 
              course={course} 
              userProgress={userProgress[courseId]}
            />
          );
        }).filter(Boolean)}
      </div>

      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
