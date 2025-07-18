
'use client';

import { useState, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { writeBatch, query, collection, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

type Granularity = 'high' | 'medium' | 'low';

interface EditProjectDialogProps {
  project: Project;
  children: ReactNode;
}

const formSchema = z.object({
  initialGoal: z.string().min(10, { message: 'The goal must be at least 10 characters long.' }),
  granularity: z.enum(['high', 'medium', 'low']),
});

export function EditProjectDialog({ project, children }: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialGoal: project.refinedGoal || project.initialGoal || '',
      granularity: project.granularity || 'high',
    },
  });

  const handleRegenerateProject = async (values: z.infer<typeof formSchema>) => {
    if (!db || !project) return;
    setIsRegenerating(true);
    try {
        const batch = writeBatch(db);

        // 1. Delete all tasks for the project
        const tasksQuery = query(collection(db, 'tasks'), where('projectID', '==', project.id));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 2. Reset project status and update goal
        const projectRef = doc(db, 'projects', project.id);
        batch.update(projectRef, { 
          status: 'generating_tasks',
          initialGoal: values.initialGoal,
          granularity: values.granularity,
          // Reset AI generated fields
          name: values.initialGoal, 
          refinedGoal: '',
          category: '',
        });
        
        await batch.commit();
        
        toast({
            title: 'Ready to Regenerate',
            description: `All old tasks have been cleared. The AI will now generate a new plan based on your updated goal.`,
        });
        
        onOpenChange(false);
        // The useEffect hook on the project page will now pick up the 'generating_tasks' status and trigger the generation.

    } catch (error: any) {
        console.error('Failed to regenerate project:', error);
        toast({
            variant: 'destructive',
            title: 'Regeneration Failed',
            description: error.message || 'Could not clear old tasks.',
        });
    } finally {
        setIsRegenerating(false);
    }
  };


  const onOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        initialGoal: project.refinedGoal || project.initialGoal || '',
        granularity: project.granularity || 'high',
      });
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit &amp; Regenerate Project Plan</DialogTitle>
          <DialogDescription>
            Refine your primary objective. This will delete all existing tasks and ask the AI to generate a completely new plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="initialGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Goal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Achieve initial 'free' sign-ons for Referru..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="granularity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Task Granularity</FormLabel>
                   <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="high" id={`high-${project.id}`} />
                        </FormControl>
                        <Label htmlFor={`high-${project.id}`} className="font-normal">High</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                         <FormControl>
                           <RadioGroupItem value="medium" id={`medium-${project.id}`} />
                         </FormControl>
                        <Label htmlFor={`medium-${project.id}`} className="font-normal">Medium</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="low" id={`low-${project.id}`} />
                        </FormControl>
                        <Label htmlFor={`low-${project.id}`} className="font-normal">Low</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button type="button" disabled={isRegenerating || !form.formState.isValid} className="w-full sm:w-auto">
                           {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4"/>}
                           Regenerate Plan
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to regenerate?</AlertDialogTitle>
                            <AlertDialogDescription>
                               This will permanently delete all existing tasks for this project. The AI will then generate a brand new plan based on your edited goal. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={form.handleSubmit(handleRegenerateProject)}>
                                Yes, Regenerate
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
