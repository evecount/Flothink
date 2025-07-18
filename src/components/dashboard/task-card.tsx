
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Code2,
  ListChecks,
  Paintbrush,
  PenSquare,
  ClipboardCheck,
  DollarSign,
  Archive,
  LifeBuoy,
  Paperclip,
  ChevronsUpDown,
  MoreVertical,
  Theater,
  Folder,
  GraduationCap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn, getEaseOfCompletionColor } from '@/lib/utils';
import type { Task } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { EditTaskDialog } from './edit-task-dialog';

const categoryIcons: { [key: string]: React.ReactNode } = {
  research: <BookOpen className="h-4 w-4" />,
  writing: <PenSquare className="h-4 w-4" />,
  coding: <Code2 className="h-4 w-4" />,
  design: <Paintbrush className="h-4 w-4" />,
  planning: <ListChecks className="h-4 w-4" />,
  outreach: <ClipboardCheck className="h-4 w-4" />,
  sales: <DollarSign className="h-4 w-4" />,
  admin: <Archive className="h-4 w-4" />,
  support: <LifeBuoy className="h-4 w-4" />,
  default: <ClipboardCheck className="h-4 w-4" />,
};

interface TaskCardProps {
  task: Task;
  projectName?: string;
  onTaskToggle: (taskId: string, isCompleted: boolean) => void;
  onSubTaskToggle: (taskId: string, subTaskId: string, isCompleted: boolean) => void;
}

export function TaskCard({ task, projectName, onTaskToggle, onSubTaskToggle }: TaskCardProps) {
  const icon = categoryIcons[task.category.toLowerCase()] || categoryIcons.default;
  const easeColor = getEaseOfCompletionColor(task.easeOfCompletionScore);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const hasSubTasks = task.subTasks && task.subTasks.length > 0;

  const subTaskProgress = useMemo(() => {
    if (!hasSubTasks) return { completed: 0, total: 0, percentage: 0 };
    const completed = task.subTasks.filter(st => st.isCompleted).length;
    const total = task.subTasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  }, [task.subTasks, hasSubTasks]);

  return (
    <>
    <Card
      className={cn(
        'flex flex-col transition-all duration-300',
        task.isCompleted ? 'bg-card/50' : 'bg-card'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={cn('pr-2 text-lg leading-tight', task.isCompleted && 'line-through text-muted-foreground')}>
            {task.description}
          </CardTitle>
          <div className="flex-shrink-0">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        <span>Add/Edit Attachment</span>
                     </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            {task.act && (
                <Badge variant="outline" className="gap-2 w-fit">
                    <Theater className="h-3 w-3" />
                    <span>{task.act}</span>
                </Badge>
            )}
            {projectName && (
                <Link href={`/dashboard/project/${task.projectID}`}>
                    <Badge variant="secondary" className="gap-2 w-fit cursor-pointer hover:bg-secondary/80">
                        <Folder className="h-3 w-3" />
                        <span>{projectName}</span>
                    </Badge>
                </Link>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 pt-0">
        {task.learningObjective && (
            <div className="flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                <GraduationCap className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-semibold">Learning Objective</p>
                    <p className="text-sm">{task.learningObjective}</p>
                </div>
            </div>
        )}
        {hasSubTasks && (
            <Collapsible defaultOpen={true}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground">
                        <span>{subTaskProgress.completed} of {subTaskProgress.total} steps completed</span>
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  {task.subTasks.map((subTask) => (
                      <div key={subTask.id} className="flex items-center gap-3 rounded-md bg-background p-2">
                          <Checkbox
                            id={`subtask-${subTask.id}`}
                            checked={subTask.isCompleted}
                            onCheckedChange={(checked) => onSubTaskToggle(task.id, subTask.id, !!checked)}
                            aria-label={subTask.description}
                          />
                          <Label
                            htmlFor={`subtask-${subTask.id}`}
                            className={cn(
                                'text-sm font-normal cursor-pointer',
                                subTask.isCompleted && 'line-through text-muted-foreground'
                            )}
                          >
                            {subTask.description}
                          </Label>
                      </div>
                  ))}
                </CollapsibleContent>
            </Collapsible>
        )}
         {task.attachmentUrl && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" asChild className="w-full">
                            <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="h-4 w-4 mr-2" />
                                View Attachment
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{task.attachmentUrl}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between">
            <div className='flex items-center gap-2'>
                <Badge variant="secondary" className="gap-2">
                    {icon}
                    <span className="capitalize">{task.category}</span>
                </Badge>
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground sr-only">Ease</span>
                        <div className={cn('h-3 w-3 rounded-full', easeColor)}></div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ease of Completion: {task.easeOfCompletionScore}/10</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        
        {!hasSubTasks && (
            <div className="flex w-full items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.isCompleted}
                  onCheckedChange={(checked) => onTaskToggle(task.id, !!checked)}
                />
                <Label
                  htmlFor={`task-${task.id}`}
                  className={cn(
                    'text-sm font-medium leading-none cursor-pointer',
                    task.isCompleted ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  Mark as complete
                </Label>
              </div>
            </div>
        )}
        
        {hasSubTasks && (
            <div className='w-full'>
                <Progress value={subTaskProgress.percentage} className="h-2" />
            </div>
        )}

      </CardFooter>
    </Card>
    <EditTaskDialog task={task} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
