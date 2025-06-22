// Global course state management for reactive updates
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Course } from './types';

interface CourseContextType {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  addCourse: (courseData: Partial<Course> & { authorId?: string }) => Promise<Course | null>;
  updateCourse: (courseData: Partial<Course> & { authorId?: string }) => Promise<Course | null>;
  getCourseById: (id: string) => Course | undefined;
  getAllCourses: () => Course[];
  getPublishedCourses: () => Course[];
  getCoursesByAuthor: (authorId: string) => Course[];
  getVisibleCourses: () => Course[]; // New method for catalog filtering
  submitForReview: (courseId: string) => Promise<boolean>; // New method for submitting courses for review
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
}

export function CourseProvider({ children }: CourseProviderProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const fetchedCourses = await response.json();
        setCourses(fetchedCourses);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize courses on mount
    refreshCourses();
  }, [refreshCourses]);

  const addCourse = useCallback(async (courseData: Partial<Course> & { authorId?: string }) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const savedCourse = await response.json();
        await refreshCourses(); // Refresh state to trigger re-renders
        return savedCourse;
      } else {
        throw new Error('Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      return null;
    }
  }, [refreshCourses]);
  const updateCourse = useCallback(async (courseData: Partial<Course> & { authorId?: string }) => {
    try {
      if (!courseData.id) {
        throw new Error('Course ID is required for updates');
      }
      
      const response = await fetch(`/api/courses/${courseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const savedCourse = await response.json();
        await refreshCourses(); // Refresh state to trigger re-renders
        return savedCourse;
      } else {
        throw new Error('Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      return null;
    }
  }, [refreshCourses]);

  const submitForReview = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await refreshCourses(); // Refresh to get updated status
        return true;
      } else {
        throw new Error('Failed to submit course for review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit course for review');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshCourses]);

  const getCourseById = useCallback((id: string) => {
    return courses.find(course => course.id === id);
  }, [courses]);

  const getAllCourses = useCallback(() => {
    return courses;
  }, [courses]);

  const getPublishedCourses = useCallback(() => {
    return courses.filter(course => course.status === 'published');
  }, [courses]);

  const getCoursesByAuthor = useCallback((authorId: string) => {
    return courses.filter(course => course.authorId === authorId);
  }, [courses]);

  // New method to get only visible courses for the catalog
  const getVisibleCourses = useCallback(() => {
    return courses.filter(course => 
      course.visibility === 'shared' || 
      course.visibility === 'public' || 
      course.status === 'published'
    );
  }, [courses]);
  const value: CourseContextType = {
    courses,
    loading,
    error,
    refreshCourses,
    addCourse,
    updateCourse,
    getCourseById,
    getAllCourses,
    getPublishedCourses,
    getCoursesByAuthor,
    getVisibleCourses,
    submitForReview,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseStore() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseStore must be used within a CourseProvider');
  }
  return context;
}
