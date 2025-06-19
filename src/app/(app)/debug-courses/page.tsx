"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function DebugCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses || []);
      console.log('All courses:', data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Debug: All Courses in Database</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold">Current User Info:</h2>
        <p>User ID: {user?.id || 'Not logged in'}</p>
        <p>Email: {user?.email || 'N/A'}</p>
        <p>Role: {user?.role || 'N/A'}</p>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Total courses found: {courses.length}</p>
            {courses.map((course, index) => (
            <div key={course.id || index} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{course.title}</h3>
              <div className="text-sm text-gray-600 mt-2">
                <p>Author ID: {course.authorId}</p>
                <p>Status: {course.status}</p>
                <p>Visibility: {course.visibility}</p>
                <p>Created: {new Date(course.createdAt).toLocaleString()}</p>
                <p>Modules: {course.modules?.length || 0}</p>
                <p>Is Mine: {course.authorId === user?.id ? '✅ YES' : '❌ NO'}</p>
              </div>
              
              {/* Show module details */}
              {course.modules && course.modules.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Module Details:</h4>                  {course.modules.map((module: any, moduleIndex: number) => (
                    <div key={module.id || moduleIndex} className="ml-4 mb-3 p-3 bg-gray-50 rounded">
                      <p className="font-medium">{module.title}</p>
                      <p className="text-xs text-gray-500">Content Type: {module.contentType}</p>
                      <p className="text-xs text-gray-500">Content URL: {module.contentUrl || 'None'}</p>
                      <p className="text-xs text-gray-500">Video Links: {module.videoLinks?.length || 0}</p>
                      
                      {/* Show video links in detail */}
                      {module.videoLinks && module.videoLinks.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Video Links Detail:</p>                          {module.videoLinks.map((video: any, videoIndex: number) => (
                            <div key={video.id || `${module.id}-video-${videoIndex}`} className="ml-2 text-xs text-blue-600">
                              <p>• {video.title || 'Untitled'}</p>
                              <p className="text-gray-500 truncate">  URL: {video.youtubeEmbedUrl}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {courses.length === 0 && (
            <p className="text-gray-500">No courses found in database.</p>
          )}
        </div>
      )}
    </div>
  );
}
