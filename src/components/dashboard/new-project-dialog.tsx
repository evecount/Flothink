
'use client';

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus, Sparkles, FolderPlus } from 'lucide-react';
import { createProjectShell } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type Granularity = 'high' | 'medium' | 'low';

export function NewProjectDialog({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialGoal, setInitialGoal] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('high');
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const resetState = () => {
    setInitialGoal('');
    setGranularity('high');
    setError(null);
    setIsThinking(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setIsOpen(open);
  };

  const handleCreateProject = async () => {
    if (!user) {
      setError('You must be logged in to create a project.');
      return;
    }
    if (!initialGoal.trim()) {
      setError('Please enter a goal for your project.');
      return;
    }
    setIsThinking(true);
    setError(null);
    
    try {
      const projectId = await createProjectShell(
        user,
        {
          initialGoal: initialGoal,
          granularity: granularity,
        }
      );

      toast({
        title: 'Project Created!',
        description: `The AI is now generating tasks for your new project.`,
      });
      handleOpenChange(false);
      router.push(`/dashboard/project/${projectId}`);

    } catch (e: any) {
      console.error("[NewProjectDialog] Error creating project shell:", e);
      setError(e.message || "An unexpected error occurred while creating the project.");
       toast({
        variant: 'destructive',
        title: 'Failed to Create Project',
        description: e.message || "Please check the console for more details."
      })
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="w-full">
            <Plus className="mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2 text-2xl">
            <Sparkles className="text-primary" /> Create a New Project
          </DialogTitle>
           <DialogDescription>
              What do you want to achieve? The AI will generate an actionable plan for you after you create the project.
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="goal">Your Goal</Label>
              <Textarea
                id="goal"
                value={initialGoal}
                onChange={(e) => setInitialGoal(e.target.value)}
                placeholder="e.g., Achieve initial 'free' sign-ons for Referru by targeting Consumers, Brands, and Agencies..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Task Granularity</Label>
              <RadioGroup
                value={granularity}
                onValueChange={(value: Granularity) => setGranularity(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high-proj" />
                  <Label htmlFor="high-proj" className="font-normal">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium-proj" />
                  <Label htmlFor="medium-proj" className="font-normal">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low-proj" />
                  <Label htmlFor="low-proj" className="font-normal">Low</Label>
                </div>
              </RadioGroup>
                <p className="text-sm text-muted-foreground">
                {granularity === 'high' && 'Generates highly detailed sub-tasks for every step.'}
                {granularity === 'medium' && 'Generates key sub-tasks for each main task.'}
                {granularity === 'low' && 'Generates only the main tasks, with no sub-tasks.'}
              </p>
            </div>
             {error && (
              <p className="mt-2 text-right text-sm text-destructive">{error}</p>
            )}
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isThinking}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isThinking || !initialGoal.trim()}>
              {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
              Create Project
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
