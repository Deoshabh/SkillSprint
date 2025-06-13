import { getCourseById, getModuleById } from '@/lib/placeholder-data';
import { MediaPlayer } from '@/components/media-player';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ModulePage({ params }: { params: { courseId: string; moduleId: string } }) {
  const course = getCourseById(params.courseId);
  const module = getModuleById(params.courseId, params.moduleId);

  if (!course || !module) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Module or course not found.</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
  const prevModule = currentModuleIndex > 0 ? course.modules[currentModuleIndex - 1] : null;
  const nextModule = currentModuleIndex < course.modules.length - 1 ? course.modules[currentModuleIndex + 1] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow lg:w-3/4 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${course.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {course.title}
            </Link>
          </Button>
           <div className="text-sm text-muted-foreground">
            Module {currentModuleIndex + 1} of {course.modules.length}
          </div>
        </div>

        <MediaPlayer module={module} />

        {module.contentType === 'quiz' && (
           <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center"><Lightbulb className="h-5 w-5 mr-2 text-yellow-400" /> AI Quiz Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Test your understanding of this module by generating a practice quiz.
                The AI will create questions based on the content you've just learned.
              </p>
              <Button onClick={() => alert('AI Quiz Generation Initiated (Placeholder)')} className="w-full md:w-auto">
                Generate Practice Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-8">
          {prevModule ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/module/${prevModule.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous: {prevModule.title}
              </Link>
            </Button>
          ) : <div />}
          {nextModule ? (
            <Button variant="default" asChild>
              <Link href={`/courses/${course.id}/module/${nextModule.id}`}>
                Next: {nextModule.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="default" asChild>
              <Link href={`/courses/${course.id}`}>
                Finish Course <ListChecks className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:w-1/4 space-y-6 lg:sticky lg:top-20 self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-headline">Course Outline</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue={`item-${currentModuleIndex}`}>
              {course.modules.map((m, index) => (
                <AccordionItem value={`item-${index}`} key={m.id}>
                  <AccordionTrigger 
                    className={`text-sm py-2 ${m.id === module.id ? 'font-bold text-primary' : 'hover:text-primary/80'}`}
                  >
                    {index + 1}. {m.title}
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 text-xs">
                    <p className="text-muted-foreground mb-1">{m.description || 'No description available.'}</p>
                    <Link href={`/courses/${course.id}/module/${m.id}`} className="text-primary hover:underline font-medium">
                      Go to module
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
