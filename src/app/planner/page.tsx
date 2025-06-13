import { placeholderDailyPlan } from '@/lib/placeholder-data';
import { DailyPlanItem } from '@/components/daily-plan-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, PlusCircle } from 'lucide-react';

export default function PlannerPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
             <CalendarDays className="h-10 w-10 mr-3 text-primary" />
            Daily Planner
          </h1>
          <p className="text-xl text-muted-foreground mt-1">
            Your personalized schedule for {formattedDate}.
          </p>
        </div>
        <Button size="lg">
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Task
        </Button>
      </header>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Today&apos;s Tasks</CardTitle>
          <CardDescription>Stay organized and focused on your learning goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {placeholderDailyPlan.length > 0 ? (
            placeholderDailyPlan.map(task => <DailyPlanItem key={task.id} task={task} />)
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No tasks scheduled for today.</p>
              <p className="text-sm text-muted-foreground">Enjoy your day or plan something new!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Placeholder for weekly view or calendar integration */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Weekly calendar view coming soon.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
