
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { DailyTask, DailyPlans } from '@/lib/types';
import { DailyPlanItem } from '@/components/daily-plan-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, PlusCircle, Trash2, Edit, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

const taskTypeOptions: DailyTask['type'][] = ['coursework', 'quiz', 'review', 'break', 'meeting', 'personal'];

const initialTaskFormState: Partial<DailyTask> & { timeInput?: string } = {
  title: '',
  description: '',
  timeInput: '09:00', // Default time string for input
  type: 'coursework',
  isCompleted: false,
};


export default function PlannerPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<DailyTask[]>([]);
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [currentTaskForm, setCurrentTaskForm] = useState(initialTaskFormState);

  const selectedDateKey = useMemo(() => {
    return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  }, [selectedDate]);

  useEffect(() => {
    if (user && user.dailyPlans && selectedDateKey) {
      setTasksForSelectedDate(user.dailyPlans[selectedDateKey] || []);
    } else {
      setTasksForSelectedDate([]);
    }
  }, [user, selectedDateKey]);

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date || new Date());
  };

  const changeDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      if (!prevDate) return new Date();
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleOpenTaskDialog = (taskToEdit?: DailyTask) => {
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      // Convert stored time (e.g., "9:00 AM") to HH:mm for time input
      let timeInput = '09:00'; // Default
      if (taskToEdit.time) {
        try {
           // Basic parsing, assumes "H:mm AM/PM" or "HH:mm AM/PM" or "HH:mm" (24hr)
           const timeParts = taskToEdit.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
           if (timeParts) {
             let hours = parseInt(timeParts[1]);
             const minutes = timeParts[2];
             const period = timeParts[3];
             if (period && period.toLowerCase() === 'pm' && hours < 12) hours += 12;
             if (period && period.toLowerCase() === 'am' && hours === 12) hours = 0; // Midnight case
             timeInput = `${hours.toString().padStart(2, '0')}:${minutes}`;
           } else if (taskToEdit.time.match(/^\d{1,2}:\d{2}$/)) { // Matches HH:mm
             timeInput = taskToEdit.time;
           }
        } catch (e) { console.error("Error parsing task time:", e); }
      }
      setCurrentTaskForm({ ...taskToEdit, timeInput });
    } else {
      setEditingTask(null);
      setCurrentTaskForm({ ...initialTaskFormState, timeInput: format(new Date(), 'HH:mm')});
    }
    setIsTaskDialogOpen(true);
  };
  
  const handleTaskFormChange = (field: keyof typeof currentTaskForm, value: any) => {
    setCurrentTaskForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTask = () => {
    if (!currentTaskForm.title?.trim() || !currentTaskForm.timeInput?.trim()) {
      toast({ title: "Error", description: "Task title and time are required.", variant: "destructive" });
      return;
    }

    // Convert timeInput (HH:mm) to a display format (e.g., 9:00 AM)
    let displayTime = currentTaskForm.timeInput;
    try {
        const [hoursStr, minutesStr] = (currentTaskForm.timeInput || "09:00").split(':');
        const hours = parseInt(hoursStr);
        const minutes = parseInt(minutesStr);
        const dateForFormatting = new Date();
        dateForFormatting.setHours(hours, minutes);
        displayTime = format(dateForFormatting, 'h:mm a');
    } catch (e) {
        console.error("Error formatting time:", e);
        // Keep displayTime as timeInput if formatting fails
    }


    let updatedDailyPlans: DailyPlans = { ...(user?.dailyPlans || {}) };
    let tasksForDay: DailyTask[] = [...(updatedDailyPlans[selectedDateKey] || [])];

    if (editingTask) { // Update existing task
      tasksForDay = tasksForDay.map(task =>
        task.id === editingTask.id ? { ...editingTask, ...currentTaskForm, time: displayTime, id: editingTask.id } as DailyTask : task
      );
    } else { // Create new task
      const newTask: DailyTask = {
        id: uuidv4(),
        title: currentTaskForm.title!,
        description: currentTaskForm.description,
        time: displayTime,
        type: currentTaskForm.type || 'coursework',
        isCompleted: false,
        courseId: currentTaskForm.courseId,
        moduleId: currentTaskForm.moduleId,
        courseTitle: currentTaskForm.courseTitle,
        moduleTitle: currentTaskForm.moduleTitle,
        icon: currentTaskForm.icon,
      };
      tasksForDay.push(newTask);
    }
    
    updatedDailyPlans[selectedDateKey] = tasksForDay.sort((a, b) => {
        // Basic time sort, assumes consistent format or parseable
        const timeA = a.time.replace(/[^\d:]/g, '').split(':').map(Number);
        const timeB = b.time.replace(/[^\d:]/g, '').split(':').map(Number);
        if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
        return (timeA[1] || 0) - (timeB[1] || 0);
    });

    updateUserProfile({ dailyPlans: updatedDailyPlans });
    toast({ title: editingTask ? "Task Updated" : "Task Added", description: `"${currentTaskForm.title}" has been saved.` });
    setIsTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    let updatedDailyPlans: DailyPlans = { ...(user?.dailyPlans || {}) };
    let tasksForDay: DailyTask[] = [...(updatedDailyPlans[selectedDateKey] || [])];
    tasksForDay = tasksForDay.filter(task => task.id !== taskId);
    
    if (tasksForDay.length > 0) {
        updatedDailyPlans[selectedDateKey] = tasksForDay;
    } else {
        delete updatedDailyPlans[selectedDateKey]; // Remove date key if no tasks left
    }

    updateUserProfile({ dailyPlans: updatedDailyPlans });
    toast({ title: "Task Deleted", description: "The task has been removed." });
  };

  const handleToggleTaskCompletion = (taskId: string, completed: boolean) => {
    let updatedDailyPlans: DailyPlans = { ...(user?.dailyPlans || {}) };
    let tasksForDay: DailyTask[] = [...(updatedDailyPlans[selectedDateKey] || [])];
    tasksForDay = tasksForDay.map(task =>
      task.id === taskId ? { ...task, isCompleted: completed } : task
    );
    updatedDailyPlans[selectedDateKey] = tasksForDay;
    updateUserProfile({ dailyPlans: updatedDailyPlans });
  };

  const formattedSelectedDate = selectedDate
    ? format(selectedDate, 'EEEE, MMMM do, yyyy')
    : 'No date selected';

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
   if (!user) {
    return (
      <div className="text-center py-10">
        <p>Please log in to use the Daily Planner.</p>
        <Button asChild className="mt-4"><a href="/login">Login</a></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => changeDate('prev')} aria-label="Previous day">
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal text-lg h-12">
                    <CalendarIcon className="mr-3 h-5 w-5 opacity-80" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
             <Button variant="outline" size="icon" onClick={() => changeDate('next')} aria-label="Next day">
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
        <Button size="lg" onClick={() => handleOpenTaskDialog()} className="whitespace-nowrap">
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Task
        </Button>
      </header>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Tasks for: {formattedSelectedDate}</CardTitle>
          <CardDescription>Stay organized and focused on your learning goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasksForSelectedDate.length > 0 ? (
            tasksForSelectedDate.map(task => (
              <DailyPlanItem 
                key={task.id} 
                task={task} 
                onToggleCompletion={(completed) => handleToggleTaskCompletion(task.id, completed)}
                onEdit={() => handleOpenTaskDialog(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No tasks scheduled for this day.</p>
              <p className="text-sm text-muted-foreground">Enjoy your day or plan something new!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the details of your task.' : 'Add a new task to your planner for ' + (selectedDate ? format(selectedDate, 'PPP') : 'the selected date') + '.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-title" className="text-right">Title*</Label>
              <Input id="task-title" value={currentTaskForm.title || ''} onChange={(e) => handleTaskFormChange('title', e.target.value)} className="col-span-3" placeholder="e.g., Complete React Module 3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-description" className="text-right">Description</Label>
              <Textarea id="task-description" value={currentTaskForm.description || ''} onChange={(e) => handleTaskFormChange('description', e.target.value)} className="col-span-3" placeholder="e.g., Focus on hooks and state management"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-time" className="text-right">Time*</Label>
              <Input id="task-time" type="time" value={currentTaskForm.timeInput || ''} onChange={(e) => handleTaskFormChange('timeInput', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-type" className="text-right">Type</Label>
              <Select value={currentTaskForm.type || 'coursework'} onValueChange={(value: DailyTask['type']) => handleTaskFormChange('type', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypeOptions.map(typeOpt => (
                    <SelectItem key={typeOpt} value={typeOpt} className="capitalize">{typeOpt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {/* Optional Course/Module linking - simplified for now */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-course" className="text-right">Course</Label>
              <Input id="task-course" value={currentTaskForm.courseTitle || ''} onChange={(e) => handleTaskFormChange('courseTitle', e.target.value)} className="col-span-3" placeholder="Optional: Course Name"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveTask}><Save className="mr-2 h-4 w-4"/> {editingTask ? 'Save Changes' : 'Add Task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
