"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import type { Quiz, QuizAttempt } from '@/lib/types';

interface QuizTakingInterfaceProps {
  quiz: Quiz;
  moduleId: string;
  courseName?: string;
  onComplete?: (attempt: QuizAttempt) => void;
  onClose?: () => void;
  previousAttempts?: QuizAttempt[];
  maxAttempts?: number;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: { [questionId: string]: string | string[] };
  timeRemaining: number;
  isSubmitted: boolean;
  startTime: Date;
  showExplanations: boolean;
}

export function QuizTakingInterface({
  quiz,
  moduleId,
  courseName,
  onComplete,
  onClose,
  previousAttempts = [],
  maxAttempts = 3
}: QuizTakingInterfaceProps) {
  const { toast } = useToast();
  const { recordQuizResult, recordAnswer } = useProgressTracker();
  
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: (quiz.timeLimit || 30) * 60, // Convert minutes to seconds
    isSubmitted: false,
    startTime: new Date(),
    showExplanations: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);

  // Timer effect
  useEffect(() => {
    if (quizState.isSubmitted || quizState.timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.timeRemaining <= 1) {
          // Auto-submit when time runs out
          handleSubmitQuiz();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.isSubmitted, quizState.timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  }, []);

  const calculateScore = useCallback((): { score: number; totalPoints: number; percentage: number; results: any[] } => {
    let correctAnswers = 0;
    let totalPoints = 0;
    const results: any[] = [];

    quiz.questions.forEach(question => {
      const userAnswer = quizState.answers[question.id];
      const isCorrect = Array.isArray(question.correctAnswer) 
        ? Array.isArray(userAnswer) && 
          question.correctAnswer.every(ans => userAnswer.includes(ans)) &&
          userAnswer.every(ans => question.correctAnswer.includes(ans))
        : userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers += question.points;
      }
      totalPoints += question.points;

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    });

    const percentage = totalPoints > 0 ? Math.round((correctAnswers / totalPoints) * 100) : 0;
    
    return {
      score: correctAnswers,
      totalPoints,
      percentage,
      results
    };
  }, [quiz.questions, quizState.answers]);

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const endTime = new Date();
    const timeSpent = Math.round((endTime.getTime() - quizState.startTime.getTime()) / 1000 / 60); // in minutes

    try {
      const { score, totalPoints, percentage, results } = calculateScore();
      const passed = percentage >= quiz.passingScore;

      // Record individual answers with xAPI
      for (const result of results) {
        await recordAnswer(
          result.questionId,
          result.question,
          String(result.userAnswer),
          result.isCorrect,
          quiz.id,
          quiz.title
        );
      }

      // Record overall quiz result with xAPI
      await recordQuizResult(
        quiz.id,
        quiz.title,
        score,
        totalPoints,
        passed,
        moduleId,
        courseName || 'Unknown Course'
      );

      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}`,
        quizId: quiz.id,
        userId: 'current-user', // Would come from auth context
        answers: quizState.answers,
        score,
        totalPoints,
        percentage,
        passed,
        timeSpent,
        submittedAt: endTime.toISOString(),
        feedback: generateFeedback(percentage, passed)
      };

      setQuizResult(attempt);
      setQuizState(prev => ({ ...prev, isSubmitted: true }));
      
      toast({
        title: passed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${percentage}% (${score}/${totalPoints} points)`,
        variant: passed ? "default" : "destructive"
      });

      onComplete?.(attempt);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, quizState, quiz, moduleId, courseName, calculateScore, recordAnswer, recordQuizResult, toast, onComplete]);

  const generateFeedback = (percentage: number, passed: boolean): string => {
    if (percentage >= 90) return "Excellent work! You have mastered this topic.";
    if (percentage >= 80) return "Great job! You have a strong understanding of the material.";
    if (percentage >= 70) return "Good work! You've met the passing requirements.";
    if (percentage >= 60) return "You're close! Review the material and try again.";
    return "Consider reviewing the module content before retaking the quiz.";
  };

  const handleNextQuestion = () => {
    if (quizState.currentQuestionIndex < quiz.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredQuestions = Object.keys(quizState.answers).length;
  const canSubmit = answeredQuestions === quiz.questions.length;
  const attemptsRemaining = maxAttempts - previousAttempts.length;

  // Check if user has exceeded attempts
  if (previousAttempts.length >= maxAttempts && !quizState.isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Maximum Attempts Reached
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have used all {maxAttempts} attempts for this quiz. 
              {previousAttempts.some(a => a.passed) 
                ? " However, you have successfully passed with a previous attempt."
                : " Please review the module content and speak with your instructor."}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show results after submission
  if (quizState.isSubmitted && quizResult) {
    const { results } = calculateScore();
    
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {quizResult.passed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              Quiz Results
            </span>
            <Badge variant={quizResult.passed ? "default" : "destructive"}>
              {quizResult.percentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{quizResult.score}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{quizResult.timeSpent}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${quizResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                  {quizResult.passed ? 'PASSED' : 'FAILED'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Required: {quiz.passingScore}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          <Alert>
            <AlertDescription>{quizResult.feedback}</AlertDescription>
          </Alert>

          {/* Question Review Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Question Review</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuizState(prev => ({ ...prev, showExplanations: !prev.showExplanations }))}
            >
              {quizState.showExplanations ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </div>

          {/* Question Review */}
          {quizState.showExplanations && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={result.questionId} className={`border-l-4 ${result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Badge variant={result.isCorrect ? "default" : "destructive"}>
                        {result.points}/{result.maxPoints} pts
                      </Badge>
                    </div>
                    <p className="mb-3">{result.question}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Your Answer: </span>
                        <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer || 'No answer'}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div>
                          <span className="font-medium">Correct Answer: </span>
                          <span className="text-green-600">
                            {Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer}
                          </span>
                        </div>
                      )}
                      {result.explanation && (
                        <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
                          <span className="font-medium">Explanation: </span>
                          {result.explanation}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!quizResult.passed && attemptsRemaining > 0 && (
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Quiz ({attemptsRemaining} attempts left)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main quiz interface
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{quiz.title}</CardTitle>
          <div className="flex items-center gap-4">
            {quiz.timeLimit && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={`font-mono ${quizState.timeRemaining < 300 ? 'text-red-500' : ''}`}>
                  {formatTime(quizState.timeRemaining)}
                </span>
              </div>
            )}
            <Badge variant="outline">
              {attemptsRemaining} attempts left
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {quizState.currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{answeredQuestions}/{quiz.questions.length} answered</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentQuestion && (
          <QuestionComponent
            question={currentQuestion}
            answer={quizState.answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        )}

        <Separator />

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={quizState.currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {quizState.currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                disabled={!canSubmit || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick navigation */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Quick Navigation</h4>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={quizState.currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                className={`w-10 h-10 p-0 ${
                  quizState.answers[quiz.questions[index].id] 
                    ? 'bg-green-100 border-green-300' 
                    : ''
                }`}
                onClick={() => setQuizState(prev => ({ ...prev, currentQuestionIndex: index }))}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuestionComponentProps {
  question: any;
  answer: string | string[] | undefined;
  onAnswerChange: (answer: string | string[]) => void;
}

function QuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const handleMultipleChoiceChange = (value: string) => {
    onAnswerChange(value);
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentAnswers = Array.isArray(answer) ? answer : [];
    if (checked) {
      onAnswerChange([...currentAnswers, option]);
    } else {
      onAnswerChange(currentAnswers.filter(a => a !== option));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="mt-1">
          {question.points} pts
        </Badge>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          
          {question.type === 'multiple-choice' && (
            <RadioGroup value={answer as string || ''} onValueChange={handleMultipleChoiceChange}>
              {question.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {String.fromCharCode(65 + index)}) {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'true-false' && (
            <RadioGroup value={answer as string || ''} onValueChange={handleMultipleChoiceChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}

          {question.type === 'short-answer' && (
            <Input
              placeholder="Enter your answer..."
              value={answer as string || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
          )}

          {question.type === 'coding' && (
            <Textarea
              placeholder="Write your code here..."
              value={answer as string || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              rows={8}
              className="font-mono"
            />
          )}

          {question.type === 'multiple-select' && (
            <div className="space-y-2">
              {question.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`checkbox-${index}`}
                    checked={Array.isArray(answer) && answer.includes(String.fromCharCode(65 + index))}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(String.fromCharCode(65 + index), !!checked)
                    }
                  />
                  <Label htmlFor={`checkbox-${index}`} className="flex-1 cursor-pointer">
                    {String.fromCharCode(65 + index)}) {option}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
