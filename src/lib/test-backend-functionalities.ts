// Backend Functionality Test
// This file tests that all major backend AI functionalities are working properly after Clerk migration

import { generateQuiz } from '@/ai/flows/ai-quiz-generator';
import { autoGenerateCourseSyllabus } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';

export async function testBackendFunctionalities() {
  const results = {
    aiQuizGenerator: false,
    courseSyllabusGenerator: false,
    youtubeVideoSuggestions: false,
    errors: [] as string[],
  };

  // Test 1: AI Quiz Generator
  try {
    const quizResult = await generateQuiz({
      courseModuleContent: "Introduction to React hooks, useState, useEffect, and custom hooks",
      numberOfQuestions: 3
    });
    results.aiQuizGenerator = quizResult.quizQuestions.length === 3;
    console.log('✅ AI Quiz Generator working:', quizResult.quizQuestions);
  } catch (error) {
    results.errors.push(`AI Quiz Generator: ${error}`);
    console.error('❌ AI Quiz Generator failed:', error);
  }

  // Test 2: Course Syllabus Generator
  try {
    const syllabusResult = await autoGenerateCourseSyllabus({
      courseTopic: "Web Development Basics",
      targetAudience: "Beginners",
      learningObjectives: "Learn HTML, CSS, JavaScript fundamentals",
      desiredNumberOfModules: 3
    });
    results.courseSyllabusGenerator = syllabusResult.courseSyllabus.length > 100;
    console.log('✅ Course Syllabus Generator working');
  } catch (error) {
    results.errors.push(`Course Syllabus Generator: ${error}`);
    console.error('❌ Course Syllabus Generator failed:', error);
  }
  // Test 3: YouTube Video Suggestions
  try {
    const videoResult = await suggestYoutubeVideosForTopic({
      searchQuery: "React tutorial",
      preferredLanguage: "English",
      numberOfSuggestions: 2
    });
    results.youtubeVideoSuggestions = videoResult.suggestedVideos.length > 0;
    console.log('✅ YouTube Video Suggestions working:', videoResult.suggestedVideos.length, 'videos found');
  } catch (error) {
    results.errors.push(`YouTube Video Suggestions: ${error}`);
    console.error('❌ YouTube Video Suggestions failed:', error);
  }

  return results;
}

// Test can be called from any component or page during development
export default testBackendFunctionalities;
