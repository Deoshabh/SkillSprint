// src/hooks/useProgressTracker.ts
'use client';

import { useCallback } from 'react';
import { useXAPI } from '@/contexts/xapi-context';
import {
  XAPIStatement,
  XAPI_VERBS,
  XAPI_ACTIVITY_TYPES,
  createActivity,
  SKILLSPRINT_CONTEXT
} from '@/lib/xapi';

export function useProgressTracker() {
  const { xapiClient, actor, isReady } = useXAPI();

  const sendStatement = useCallback(async (statement: Omit<XAPIStatement, 'actor'>) => {
    if (!isReady || !xapiClient || !actor) {
      console.log('xAPI not ready, skipping statement');
      return;
    }

    const completeStatement: XAPIStatement = {
      ...statement,
      actor,
      context: {
        ...SKILLSPRINT_CONTEXT,
        ...statement.context
      }
    };

    await xapiClient.sendStatement(completeStatement);
  }, [xapiClient, actor, isReady]);

  const markModuleComplete = useCallback(async (
    moduleId: string,
    moduleName: string,
    courseId?: string,
    courseName?: string
  ) => {
    const moduleActivity = createActivity(
      `https://skillsprint.app/module/${moduleId}`,
      moduleName,
      `Completed module: ${moduleName}`,
      XAPI_ACTIVITY_TYPES.MODULE
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: XAPI_VERBS.COMPLETED,
      object: moduleActivity,
      result: {
        completion: true,
        success: true
      }
    };

    // Add course as parent context if provided
    if (courseId && courseName) {
      statement.context = {
        contextActivities: {
          parent: [createActivity(
            `https://skillsprint.app/course/${courseId}`,
            courseName,
            `Course: ${courseName}`,
            XAPI_ACTIVITY_TYPES.COURSE
          )]
        }
      };
    }

    await sendStatement(statement);
  }, [sendStatement]);

  const recordQuizResult = useCallback(async (
    quizId: string,
    quizName: string,
    score: number,
    maxScore: number,
    passed: boolean,
    moduleId?: string,
    moduleName?: string
  ) => {
    const quizActivity = createActivity(
      `https://skillsprint.app/quiz/${quizId}`,
      quizName,
      `Quiz: ${quizName}`,
      XAPI_ACTIVITY_TYPES.QUIZ
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: passed ? XAPI_VERBS.PASSED : XAPI_VERBS.FAILED,
      object: quizActivity,
      result: {
        score: {
          raw: score,
          max: maxScore,
          scaled: maxScore > 0 ? score / maxScore : 0
        },
        success: passed,
        completion: true
      }
    };

    // Add module as parent context if provided
    if (moduleId && moduleName) {
      statement.context = {
        contextActivities: {
          parent: [createActivity(
            `https://skillsprint.app/module/${moduleId}`,
            moduleName,
            `Module: ${moduleName}`,
            XAPI_ACTIVITY_TYPES.MODULE
          )]
        }
      };
    }

    await sendStatement(statement);
  }, [sendStatement]);

  const markVideoWatched = useCallback(async (
    videoId: string,
    videoTitle: string,
    duration?: number,
    moduleId?: string,
    moduleName?: string
  ) => {
    const videoActivity = createActivity(
      `https://skillsprint.app/video/${videoId}`,
      videoTitle,
      `Video: ${videoTitle}`,
      XAPI_ACTIVITY_TYPES.VIDEO
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: XAPI_VERBS.WATCHED,
      object: videoActivity,
      result: {
        completion: true
      }
    };

    // Add duration if provided
    if (duration) {
      statement.result!.duration = `PT${Math.round(duration)}S`; // ISO 8601 duration format
    }

    // Add module as parent context if provided
    if (moduleId && moduleName) {
      statement.context = {
        contextActivities: {
          parent: [createActivity(
            `https://skillsprint.app/module/${moduleId}`,
            moduleName,
            `Module: ${moduleName}`,
            XAPI_ACTIVITY_TYPES.MODULE
          )]
        }
      };
    }

    await sendStatement(statement);
  }, [sendStatement]);

  const markCourseStarted = useCallback(async (
    courseId: string,
    courseName: string
  ) => {
    const courseActivity = createActivity(
      `https://skillsprint.app/course/${courseId}`,
      courseName,
      `Started course: ${courseName}`,
      XAPI_ACTIVITY_TYPES.COURSE
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: XAPI_VERBS.EXPERIENCED,
      object: courseActivity,
      result: {
        completion: false
      }
    };

    await sendStatement(statement);
  }, [sendStatement]);

  const markCourseCompleted = useCallback(async (
    courseId: string,
    courseName: string,
    completedModules: number,
    totalModules: number
  ) => {
    const courseActivity = createActivity(
      `https://skillsprint.app/course/${courseId}`,
      courseName,
      `Completed course: ${courseName}`,
      XAPI_ACTIVITY_TYPES.COURSE
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: XAPI_VERBS.COMPLETED,
      object: courseActivity,
      result: {
        completion: true,
        success: true,
        score: {
          raw: completedModules,
          max: totalModules,
          scaled: totalModules > 0 ? completedModules / totalModules : 0
        }
      }
    };

    await sendStatement(statement);
  }, [sendStatement]);

  const recordAnswer = useCallback(async (
    questionId: string,
    questionText: string,
    answer: string,
    isCorrect: boolean,
    quizId?: string,
    quizName?: string
  ) => {
    const questionActivity = createActivity(
      `https://skillsprint.app/question/${questionId}`,
      questionText,
      `Question: ${questionText}`,
      XAPI_ACTIVITY_TYPES.QUESTION
    );

    const statement: Omit<XAPIStatement, 'actor'> = {
      verb: XAPI_VERBS.ANSWERED,
      object: questionActivity,
      result: {
        success: isCorrect,
        completion: true
      }
    };

    // Add quiz as parent context if provided
    if (quizId && quizName) {
      statement.context = {
        contextActivities: {
          parent: [createActivity(
            `https://skillsprint.app/quiz/${quizId}`,
            quizName,
            `Quiz: ${quizName}`,
            XAPI_ACTIVITY_TYPES.QUIZ
          )]
        }
      };
    }

    await sendStatement(statement);
  }, [sendStatement]);

  return {
    markModuleComplete,
    recordQuizResult,
    markVideoWatched,
    markCourseStarted,
    markCourseCompleted,
    recordAnswer,
    isReady
  };
}
