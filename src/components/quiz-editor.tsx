"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trash2, Plus, HelpCircle, Clock, Check, X, Wand2, Loader2, AlertTriangle, 
  Brain, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DragDropList } from "@/components/ui/drag-drop-list";
import type { QuizData, QuizQuestion } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { autoGenerateAssessments } from "@/ai/flows/auto-generate-quiz-mock-tests";

interface QuizEditorProps {
  quizData: QuizData | undefined;
  onChange: (quizData: QuizData) => void;
  className?: string;
  moduleContent?: string; // Optional module content for AI quiz generation
  moduleTitle?: string; // Optional module title for AI quiz generation
}

export function QuizEditor({ quizData, onChange, className, moduleContent, moduleTitle }: QuizEditorProps) {
  const { toast } = useToast();
  const initialQuizData: QuizData = quizData || {
    questions: [],
    timeLimit: 30,
    passingScore: 70,
    attempts: 3,
  };

  const [quiz, setQuiz] = React.useState<QuizData>(initialQuizData);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = React.useState(false);
  const [aiQuizGenerationError, setAiQuizGenerationError] = React.useState<string | null>(null);
  const [numQuestionsToGenerate, setNumQuestionsToGenerate] = React.useState(5);
  const [isAIDialogOpen, setIsAIDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setQuiz(quizData || initialQuizData);
  }, [quizData]);

  const handleQuizSettingChange = (
    field: keyof Omit<QuizData, "questions">,
    value: number
  ) => {
    const updatedQuiz = { ...quiz, [field]: value };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 10,
    };
    const updatedQuiz = {
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...quiz.questions];
    const question = { ...updatedQuestions[questionIndex] };
    const options = [...(question.options || [])];
    options[optionIndex] = value;
    question.options = options;
    updatedQuestions[questionIndex] = question;
    
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions.splice(index, 1);
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...quiz.questions];
    const question = { ...updatedQuestions[questionIndex] };
    const options = [...(question.options || []), ""];
    question.options = options;
    updatedQuestions[questionIndex] = question;
    
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...quiz.questions];
    const question = { ...updatedQuestions[questionIndex] };
    const options = [...(question.options || [])];
    options.splice(optionIndex, 1);
    question.options = options;
    updatedQuestions[questionIndex] = question;
    
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const setCorrectAnswer = (questionIndex: number, value: string | string[]) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      correctAnswer: value,
    };
    const updatedQuiz = { ...quiz, questions: updatedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };
  const reorderQuestions = (reorderedQuestions: QuizQuestion[]) => {
    const updatedQuiz = { ...quiz, questions: reorderedQuestions };
    setQuiz(updatedQuiz);
    onChange(updatedQuiz);
  };

  const generateAIQuiz = async () => {
    if (!moduleContent) {
      setAiQuizGenerationError("Module content is required to generate quiz questions.");
      toast({
        title: "Error",
        description: "Module content is required to generate quiz questions.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuiz(true);
    setAiQuizGenerationError(null);

    try {
      // Use the auto-generate-assessments AI flow
      const result = await autoGenerateAssessments({
        moduleContent,
        assessmentType: "quiz",
        numberOfQuestions: numQuestionsToGenerate
      });

      // Parse the assessment string into quiz questions
      const assessmentText = result.assessment;
      
      // Process and convert the assessment text into quiz question objects
      const newQuestions = parseAIGeneratedQuizQuestions(assessmentText);
      
      // Add the new questions to the current quiz
      const updatedQuiz = {
        ...quiz,
        questions: [...quiz.questions, ...newQuestions]
      };
      
      setQuiz(updatedQuiz);
      onChange(updatedQuiz);
      
      toast({
        title: "Success",
        description: `Generated ${newQuestions.length} new quiz questions.`,
      });

      setIsAIDialogOpen(false);
    } catch (error) {
      console.error("Error generating quiz:", error);
      setAiQuizGenerationError("Failed to generate quiz questions. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate quiz questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };
  
  // Helper function to parse AI-generated quiz questions into the required structure
  const parseAIGeneratedQuizQuestions = (assessmentText: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    
    // Simple parsing logic - look for numerical markers and question patterns
    // This is a basic implementation that may need refinement based on actual AI output
    const questionBlocks = assessmentText.split(/\d+\.\s/).filter(block => block.trim().length > 0);
    
    for (const block of questionBlocks) {
      // Try to identify multiple choice questions
      const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) continue; // Skip if there's not enough content
      
      const questionText = lines[0];
      const options: string[] = [];
      let correctAnswer = "";
      let questionType: string = "multiple-choice";
      
      // Look for options marked with A), B), C), etc. or a. b. c. patterns
      const optionLines = lines.slice(1).filter(line => 
        /^[A-D][).]\s|^[a-d][).]\s/.test(line));
      
      if (optionLines.length >= 2) {
        // It's likely a multiple-choice question
        options.push(...optionLines.map(line => {
          // Extract the option text without the prefix (A), B), etc.)
          return line.replace(/^[A-Da-d][).]\s/, '').trim();
        }));
        
        // Try to find the correct answer marker
        const correctAnswerLine = lines.find(line => 
          line.toLowerCase().includes("correct answer") || 
          line.toLowerCase().includes("answer:"));
        
        if (correctAnswerLine) {
          // Extract the correct option (A, B, C, D)
          const match = correctAnswerLine.match(/[A-Da-d]/);
          if (match) {
            const correctOptionIndex = match[0].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
            if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
              correctAnswer = options[correctOptionIndex];
            }
          } else {
            // If we can't find a letter, use the first option as default
            correctAnswer = options[0];
          }
        } else {
          // Default to the first option if no correct answer is marked
          correctAnswer = options[0];
        }
      } else {
        // It might be a true/false or short answer question
        if (questionText.toLowerCase().includes("true or false") || 
            questionText.toLowerCase().includes("true/false")) {
          questionType = "true-false";
          options.length = 0; // Clear any options
          correctAnswer = lines.find(line => 
            line.toLowerCase().includes("answer:") || 
            line.toLowerCase().includes("correct:"))?.toLowerCase().includes("true") ? "true" : "false";
        } else {
          // Assume it's a short answer question
          questionType = "short-answer";
          options.length = 0; // Clear any options
          correctAnswer = lines.find(line => 
            line.toLowerCase().includes("answer:") || 
            line.toLowerCase().includes("correct:"))?.replace(/answer:|correct:/i, '').trim() || "";
        }
      }
      
      // Create the question object
      questions.push({
        id: uuidv4(),
        question: questionText,
        type: questionType as "multiple-choice" | "true-false" | "short-answer" | "essay",
        options: options.length > 0 ? options : ["", "", "", ""],
        correctAnswer,
        explanation: lines.find(line => 
          line.toLowerCase().includes("explanation:"))?.replace(/explanation:/i, '').trim() || "",
        points: 10
      });
    }
    
    return questions;
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Quiz Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={5}
                max={180}
                value={quiz.timeLimit || 30}
                onChange={(e) => handleQuizSettingChange("timeLimit", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min={1}
                max={100}
                value={quiz.passingScore || 70}
                onChange={(e) => handleQuizSettingChange("passingScore", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="attempts">Allowed Attempts</Label>
              <Input
                id="attempts"
                type="number"
                min={1}
                max={10}
                value={quiz.attempts || 3}
                onChange={(e) => handleQuizSettingChange("attempts", parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questions ({quiz.questions.length})</h3>
        <div className="flex gap-2">
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!moduleContent}
                className={cn(
                  "gap-1.5",
                  !moduleContent && "opacity-50 cursor-not-allowed"
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Generate</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Generate Quiz Questions with AI
                </DialogTitle>
                <DialogDescription>
                  Our AI will generate quiz questions based on the module content.
                  {moduleTitle && <p className="mt-1 font-medium">Module: {moduleTitle}</p>}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="num-questions">Number of questions to generate</Label>
                  <Input
                    id="num-questions"
                    type="number"
                    min={1}
                    max={10}
                    value={numQuestionsToGenerate}
                    onChange={(e) => setNumQuestionsToGenerate(parseInt(e.target.value) || 5)}
                  />
                </div>
                
                {!moduleContent && (
                  <div className="rounded-md bg-amber-50 p-3 text-amber-700 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <p>
                      No module content found. Please add some content to the module first
                      to generate relevant quiz questions.
                    </p>
                  </div>
                )}
                
                {aiQuizGenerationError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>{aiQuizGenerationError}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={generateAIQuiz} 
                  disabled={isGeneratingQuiz || !moduleContent}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </div>
      </div>

      {quiz.questions.length > 0 ? (
        <DragDropList
          items={quiz.questions}
          onReorder={reorderQuestions}
          renderItem={(question, index) => (
            <Card className="w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div>
                  <Label htmlFor={`question-${question.id}`}>Question</Label>
                  <Textarea
                    id={`question-${question.id}`}
                    value={question.question}
                    onChange={(e) => updateQuestion(index, "question", e.target.value)}
                    placeholder="Enter the question text"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`question-type-${question.id}`}>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestion(index, "type", value)}
                  >
                    <SelectTrigger id={`question-type-${question.id}`} className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="short-answer">Short Answer</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {question.type === "multiple-choice" && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {(question.options || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={question.correctAnswer === option ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setCorrectAnswer(index, option)}
                        >
                          {question.correctAnswer === option ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="h-4 w-4"></span>
                          )}
                        </Button>
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeOption(index, optionIndex)}
                          disabled={(question.options?.length || 0) <= 2}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(index)}
                      className="mt-1"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Option
                    </Button>
                  </div>
                )}

                {question.type === "true-false" && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={question.correctAnswer === "true" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCorrectAnswer(index, "true")}
                      >
                        True
                      </Button>
                      <Button
                        type="button"
                        variant={question.correctAnswer === "false" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCorrectAnswer(index, "false")}
                      >
                        False
                      </Button>
                    </div>
                  </div>
                )}

                {(question.type === "short-answer" || question.type === "essay") && (
                  <div>
                    <Label htmlFor={`correct-answer-${question.id}`}>Expected Answer/Keywords</Label>
                    <Textarea
                      id={`correct-answer-${question.id}`}
                      value={typeof question.correctAnswer === "string" ? question.correctAnswer : ""}
                      onChange={(e) => setCorrectAnswer(index, e.target.value)}
                      placeholder={question.type === "short-answer" ? "Enter the expected answer or keywords" : "Enter evaluation guidelines"}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`explanation-${question.id}`}>Explanation (Optional)</Label>
                  <Textarea
                    id={`explanation-${question.id}`}
                    value={question.explanation || ""}
                    onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                    placeholder="Explanation for the correct answer"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`points-${question.id}`}>Points</Label>
                  <Input
                    id={`points-${question.id}`}
                    type="number"
                    min={1}
                    max={100}
                    value={question.points || 10}
                    onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value))}
                    className="mt-1 w-24"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        />      ) : (
        <Card className="text-center p-8">
          <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No questions added yet. Click "Add Question" to create your quiz manually or use the 
            "AI Generate" button to automatically generate questions based on the module content.
          </p>
          {moduleContent && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAIDialogOpen(true)} 
              className="mt-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Quiz with AI
            </Button>
          )}
        </Card>
      )}

      {quiz.questions.length > 0 && (
        <Button onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" /> Add Another Question
        </Button>
      )}
    </div>
  );
}
