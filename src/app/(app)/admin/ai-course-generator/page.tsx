
"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Loader2, AlertTriangle, Sparkles, ListChecks, ShieldCheck, Users, BarChartBig, SendHorizonal } from 'lucide-react';
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import type { Module as ModuleType } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AICourseGeneratorPage() {
  const { toast } = useToast();
  
  const [aiTopic, setAiTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Beginners');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [desiredModules, setDesiredModules] = useState(5);
  
  const [rawSyllabusResult, setRawSyllabusResult] = useState<string | null>(null);
  const [parsedModulesResult, setParsedModulesResult] = useState<ModuleType[]>([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [errorSyllabus, setErrorSyllabus] = useState<string | null>(null);

  const parseSyllabusToModules = (syllabusText: string): ModuleType[] => {
    const generatedModules: ModuleType[] = [];
    const moduleRegex = /^(?:#+\s*)?Module\s*\d*[:\s-]*\s*(.*?)(?:\n|$)([\s\S]*?)(?=(?:#+\s*)?Module\s*\d*[:\s-]*|\Z)/gim;
    
    let match;
    while ((match = moduleRegex.exec(syllabusText)) !== null) {
        const title = match[1].trim().replace(/\*+/g, '');
        let contentBlock = match[2] || '';
        let description = '';
        const descriptionMatch = contentBlock.match(/^([\s\S]*?)(?:(?:#+\s*)?Topics:|(?:#+\s*)?Learning Activities:|$)/i);
        if (descriptionMatch && descriptionMatch[1]) {
            description = descriptionMatch[1].trim();
            contentBlock = contentBlock.substring(description.length).trim();
        }
        
        let subtopics: string[] = [];
        const topicsMatch = contentBlock.match(/(?:#+\s*)?Topics:([\s\S]*?)(?:(?:#+\s*)?Learning Activities:|$)/i);
        if (topicsMatch && topicsMatch[1]) {
            subtopics = topicsMatch[1].split('\n').map(s => s.replace(/^-|^\*|^\d+\.\s*/, '').trim()).filter(s => s && s.length > 2);
        }

        let practiceTask = '';
        const activitiesMatch = contentBlock.match(/(?:#+\s*)?Learning Activities:([\s\S]*)/i);
        if (activitiesMatch && activitiesMatch[1]) {
            const activitiesText = activitiesMatch[1].trim();
            const activityLines = activitiesText.split('\n').map(s => s.replace(/^-|^\*|^\d+\.\s*/, '').trim()).filter(s => s);
            if (activityLines.length > 0) {
                const taskKeywords = ["build", "create", "design", "develop", "write", "implement", "complete", "solve"];
                let foundTask = activityLines.find(line => taskKeywords.some(keyword => line.toLowerCase().startsWith(keyword)));
                practiceTask = foundTask || activityLines[0];
            }
        }
        if (!description && subtopics.length > 0) {
            description = `Focuses on: ${subtopics.join(', ').substring(0, 100)}...`;
        } else if (!description) {
            description = `Details for ${title}`;
        }

        generatedModules.push({
            id: uuidv4(),
            title: title || `Module ${generatedModules.length + 1}`,
            description: description.substring(0, 250),
            subtopics,
            practiceTask: practiceTask.substring(0, 250),
            contentType: 'video', 
            estimatedTime: '1 week',
            contentUrl: '',
            videoLinks: [],
        });
    }
    if (generatedModules.length === 0 && syllabusText.includes('\n')) {
        const lines = syllabusText.split('\n').map(s => s.trim()).filter(s => s.length > 5);
        if (lines.length > 1 && lines.length <= 15) {
             lines.forEach((line, index) => {
                generatedModules.push({
                    id: uuidv4(),
                    title: line.replace(/^-|^\*|^\d+\.\s*/, '').trim() || `Module ${index + 1}`,
                    description: `Details for ${line}`,
                    subtopics: [],
                    practiceTask: '',
                    contentType: 'video',
                    estimatedTime: '1 week',
                    contentUrl: '',
                    videoLinks: [],
                });
            });
        }
    }
    return generatedModules;
  };

  const handleGenerateSyllabus = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast({ title: "Error", description: "Please enter a course topic.", variant: "destructive" });
      return;
    }
    setLoadingSyllabus(true); 
    setErrorSyllabus(null); 
    setRawSyllabusResult(null);
    setParsedModulesResult([]);

    try {
      const input: AutoGenerateCourseSyllabusInput = { 
        courseTopic: aiTopic, 
        targetAudience, 
        learningObjectives, 
        desiredNumberOfModules: desiredModules 
      };
      const result = await autoGenerateCourseSyllabus(input);
      setRawSyllabusResult(result.courseSyllabus);

      if (result.courseSyllabus) {
          const parsed = parseSyllabusToModules(result.courseSyllabus);
          setParsedModulesResult(parsed);
          if (parsed.length > 0) {
              toast({ title: "AI Course Structure Generated!", description: `${parsed.length} modules outlined. You can now use this structure in the Course Designer.`});
          } else {
               toast({ title: "AI Syllabus Generated", description: "Syllabus text is available, but couldn't auto-structure into modules. Review raw output or refine AI prompt."});
          }
      } else {
           toast({ title: "AI Syllabus Failed", description: "The AI did not return a syllabus. Try adjusting your inputs.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error generating syllabus:", err);
      const errorMsg = err instanceof Error ? err.message : "Syllabus generation failed.";
      setErrorSyllabus(errorMsg);
      toast({ title: "AI Syllabus Failed", description: errorMsg, variant: "destructive" });
    } finally {
      setLoadingSyllabus(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Sparkles className="h-10 w-10 mr-3 text-primary" />
          AI Course Structure Generator
        </h1>
        <p className="text-xl text-muted-foreground">
          Admins: Generate a full course outline with modules, topics, and activities using AI.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-xl lg:sticky lg:top-24">
            <CardHeader>
            <CardTitle className="text-2xl">AI Course Structure Parameters</CardTitle>
            <CardDescription>Define your course to get a structured outline from AI.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleGenerateSyllabus} className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="aiTopic">Course Topic*</Label>
                <Input id="aiTopic" placeholder="e.g., Introduction to Quantum Physics" value={aiTopic} onChange={(e: ChangeEvent<HTMLInputElement>) => setAiTopic(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input id="targetAudience" placeholder="e.g., Beginners, Advanced Developers" value={targetAudience} onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="learningObjectives">Learning Objectives (comma-separated)</Label>
                <Textarea id="learningObjectives" placeholder="e.g., Understand core concepts, Build a web app" value={learningObjectives} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLearningObjectives(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="desiredModules">Desired Number of Modules*</Label>
                <Input id="desiredModules" type="number" min="1" max="20" value={desiredModules} onChange={(e: ChangeEvent<HTMLInputElement>) => setDesiredModules(parseInt(e.target.value, 10) || 1)} required/>
                </div>
                <Button type="submit" disabled={loadingSyllabus} className="w-full">
                {loadingSyllabus ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Wand2 className="h-5 w-5 mr-2" />}
                Generate Course Structure
                </Button>
            </form>
            </CardContent>
        </Card>

        <div className="space-y-6">
            {errorSyllabus && (
                <Card className="border-destructive bg-destructive/10">
                    <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="h-5 w-5 mr-2" /> Error</CardTitle></CardHeader>
                    <CardContent><p>{errorSyllabus}</p></CardContent>
                </Card>
            )}

            {parsedModulesResult.length > 0 && !loadingSyllabus && (
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center"><ListChecks className="h-6 w-6 mr-2 text-primary"/>Generated Course Structure ({parsedModulesResult.length} Modules)</CardTitle>
                        <CardDescription>Review the AI-generated module outline. You can copy this information to create a new course in the main <Link href="/course-designer" className="text-primary hover:underline">Course Designer</Link>.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] pr-3">
                            <Accordion type="multiple" className="w-full space-y-3">
                                {parsedModulesResult.map((module, index) => (
                                <AccordionItem value={`module-${module.id}`} key={module.id} className="border rounded-md bg-card shadow-sm">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <span className="font-semibold text-left">{index + 1}. {module.title}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0 space-y-2 text-sm">
                                        {module.description && <p><strong className="text-muted-foreground">Description:</strong> {module.description}</p>}
                                        {module.subtopics && module.subtopics.length > 0 && (
                                            <div>
                                                <strong className="text-muted-foreground">Subtopics:</strong>
                                                <ul className="list-disc list-inside pl-4 text-xs">
                                                    {module.subtopics.map((sub, i) => <li key={i}>{sub}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {module.practiceTask && <p><strong className="text-muted-foreground">Suggested Task:</strong> {module.practiceTask}</p>}
                                        <p className="text-xs text-muted-foreground">Est. Time: {module.estimatedTime} (Default)</p>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {rawSyllabusResult && parsedModulesResult.length === 0 && !loadingSyllabus && (
                 <Card className="shadow-md">
                    <CardHeader><CardTitle className="text-xl">Raw AI Syllabus Output</CardTitle><CardDescription>The AI generated syllabus text, but it could not be automatically parsed into modules. You can use this text manually.</CardDescription></CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto bg-muted p-4 rounded-md"><ReactMarkdown>{rawSyllabusResult}</ReactMarkdown></CardContent>
                </Card>
            )}
             {(!rawSyllabusResult && !loadingSyllabus && !errorSyllabus && aiTopic) && (
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <p>No results to display. Please generate a course structure using the form.</p>
                    </CardContent>
                 </Card>
            )}
        </div>
      </div>

      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                Admin Capabilities Overview
            </CardTitle>
            <CardDescription>Current and planned features for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Review and approve/reject courses. (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Manage published/rejected courses (Unpublish, Move to Draft). (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Edit content for any course on the platform using the Course Designer. (Implemented)</strong> <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Open Designer)</Link></li>
                <li><strong className="text-foreground">Advanced AI-powered tools: (Implemented)</strong>
                    <ul className="list-disc pl-5">
                        <li>Syllabus & Full Module Structure Generation. <Link href="/admin/ai-course-generator" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                        <li>Module-level content suggestions (subtopics, tasks, videos) within Course Designer. <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Use in Designer)</Link></li>
                    </ul>
                </li>
                <li><strong className="text-foreground">Utilize AI tools to find and suggest updated content (AI Content Scout). (Implemented)</strong> <Link href="/admin/content-scout" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                <li><strong className="text-foreground">Set platform-wide limits (Initial: Limit visible, enforcement in place).</strong></li>
                <li><strong className="text-foreground">Manage user roles and permissions (Initial Simulation Implemented: Can change current admin's role).</strong> <Link href="/admin/user-management" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">View platform analytics and reports (Placeholder UI Implemented).</strong> <Link href="/admin/analytics" className="text-xs text-primary hover:underline ml-1">(View)</Link></li>
                <li><strong className="text-foreground">Broadcast messaging to user segments (Placeholder UI Implemented).</strong> <Link href="/admin/messaging" className="text-xs text-primary hover:underline ml-1">(Compose)</Link></li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    