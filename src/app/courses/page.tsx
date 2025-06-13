import { placeholderCourses } from '@/lib/placeholder-data';
import { CourseCard } from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, ListRestart } from 'lucide-react';

export default function CoursesPage() {
  const categories = Array.from(new Set(placeholderCourses.map(course => course.category)));

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
            <Input placeholder="Search courses..." className="pl-10 w-full" />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category.toLowerCase().replace(' ', '-')}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <ListRestart className="h-4 w-4 mr-2" />
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
        {placeholderCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Button variant="outline" size="lg">Load More Courses</Button>
      </div>
    </div>
  );
}
