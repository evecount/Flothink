
'use client';

import { useState, ReactNode, Fragment } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Sparkles, ChevronsUpDown, FolderPlus } from 'lucide-react';
import {
  goalClarification,
  type ClarificationQuestion,
  type ConversationTurn,
  type Task as GenkitTask
} from '@/ai/flows/goal-clarification';
import { addTasksToProject } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


type Step = 'initial' | 'clarifying' | 'reviewing_tasks' | 'error';
type Granularity = 'high' | 'medium' | 'low';

export function NewActDialog({ projectId, children }: { projectId: string, children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('initial');
  const [initialGoal, setInitialGoal] = useState('');
  const [refinedGoal, setRefinedGoal] = useState('');
  const [previousAnswers, setPreviousAnswers] = useState<ConversationTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<ClarificationQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<GenkitTask[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('high');
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();


  const resetState = () => {
    setStep('initial');
    setInitialGoal('');
    setRefinedGoal('');
    setPreviousAnswers([]);
    setCurrentQuestion(null);
    setSelectedOption('');
    setTextAnswer('');
    setGeneratedTasks([]);
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

  const startOver = () => {
      const currentGoal = initialGoal;
      resetState();
      setInitialGoal(currentGoal);
  }

  const handleNextClarification = async () => {
    setError(null);
    setIsThinking(true);

    try {
      if (step === 'initial' && !initialGoal.trim()) {
        setError('Please enter a goal for this new act.');
        setIsThinking(false);
        return;
      }
        
      setStep('clarifying');

      let inputAnswers = previousAnswers;
      if (step === 'clarifying' && currentQuestion) {
          const answer =
            currentQuestion.type === 'multiple-choice'
              ? selectedOption
              : textAnswer;

          if (!answer.trim()) {
            setError('Please provide an answer.');
            setIsThinking(false);
            return;
          }
          
          inputAnswers = [
            ...previousAnswers,
            { question: currentQuestion.question, answer },
          ];
          setPreviousAnswers(inputAnswers);
          setSelectedOption('');
          setTextAnswer('');
          setCurrentQuestion(null);
      }
      
      const res = await goalClarification({
        initialGoal,
        granularity,
        previousAnswers: inputAnswers,
      });

      if (res.isComplete) {
        setRefinedGoal(res.refinedGoal);
        setGeneratedTasks(res.tasks || []);
        setStep('reviewing_tasks');
      } else {
        setCurrentQuestion(res.nextQuestion || null);
      }

    } catch (e: any) {
      console.error("[NewActDialog] Error during goal clarification:", e);
      setError(e.message || "An unexpected error occurred. Please try again.");
      setStep('error');
    } finally {
      setIsThinking(false);
    }
  };


  const handleCreateAct = async () => {
    if (!user) {
      setError('You must be logged in to create a project.');
      return;
    }
    if (generatedTasks.length === 0) {
      setError('No tasks were generated. Cannot create an empty act.');
      return;
    }
    setIsThinking(true);
    setError(null);

    try {
      await addTasksToProject(projectId, user.uid, generatedTasks);
      toast({
        title: 'Act Added!',
        description: `The new tasks have been added to your project.`,
      });
      handleOpenChange(false);
    } catch (e: any) {
      console.error("[NewActDialog] Error creating project:", e);
      setError(e.message || "An unexpected error occurred while creating the project.");
      setStep('error');
      toast({
        variant: 'destructive',
        title: 'Failed to Add Act',
        description: e.message || "Please check the console for more details."
      })
    } finally {
      setIsThinking(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div>
            <DialogDescription>
              Describe the next major goal or phase for this project. This will become a new "Act" with its own set of micro-tasks.
            </DialogDescription>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="goal">New Act Goal</Label>
                <Textarea
                    id="goal"
                    value={initialGoal}
                    onChange={(e) => setInitialGoal(e.target.value)}
                    placeholder="e.g., Launch the marketing campaign..."
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
                      <RadioGroupItem value="high" id="high-act" />
                      <Label htmlFor="high-act" className="font-normal">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium-act" />
                      <Label htmlFor="medium-act" className="font-normal">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low-act" />
                      <Label htmlFor="low-act" className="font-normal">Low</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">
                    {granularity === 'high' && 'Generates highly detailed sub-tasks for every step.'}
                    {granularity === 'medium' && 'Generates key sub-tasks for each main task.'}
                    {granularity === 'low' && 'Generates only the main tasks, with no sub-tasks.'}
                  </p>
                </div>
            </div>
          </div>
        );
      case 'clarifying':
        return (
            <div>
              <div className="space-y-4 py-4">
                <ScrollArea className="h-72 w-full pr-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-end">
                      <div className="max-w-xs rounded-lg bg-primary px-4 py-3 text-primary-foreground">
                        {initialGoal}
                      </div>
                    </div>

                    {previousAnswers.map((turn, index) => (
                      <Fragment key={index}>
                        <div className="flex items-start justify-start">
                          <div className="max-w-xs rounded-lg bg-muted px-4 py-3">
                            {turn.question}
                          </div>
                        </div>
                        { turn.answer && (
                          <div className="flex items-start justify-end">
                              <div className="max-w-xs rounded-lg bg-primary px-4 py-3 text-primary-foreground">
                              {turn.answer}
                              </div>
                          </div>
                        )}
                      </Fragment>
                    ))}

                    {(isThinking || currentQuestion) && (
                      <div className="flex items-start justify-start">
                        <div className="max-w-xs rounded-lg bg-muted px-4 py-3">
                          {isThinking && !currentQuestion ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          ) : (
                            <p>{currentQuestion?.question}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {currentQuestion && !isThinking && (
                  <div className="pt-4 border-t">
                    {currentQuestion.type === 'multiple-choice' && (
                      <RadioGroup
                        value={selectedOption}
                        onValueChange={setSelectedOption}
                        className="mt-2 space-y-2"
                      >
                        {currentQuestion.options?.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="font-normal">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    {currentQuestion.type === 'text' && (
                        <Textarea 
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Your answer..."
                          rows={3}
                        />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
      case 'reviewing_tasks':
        return (
            <div>
              <DialogDescription>
                Here is the plan for your new Act based on the goal: <span className="italic">"{refinedGoal}"</span>. Review the tasks and confirm to add them to your project.
              </DialogDescription>
              <ScrollArea className="h-72 my-4 rounded-md border">
                 <div className="p-4 space-y-2">
                    {generatedTasks.map((task) => (
                        <Collapsible key={task.description} className="space-y-2">
                            <Card>
                                <div className="flex items-center justify-between p-3">
                                    <p className="font-semibold leading-tight flex-1 pr-2">{task.description}</p>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-9 p-0">
                                            <ChevronsUpDown className="h-4 w-4" />
                                            <span className="sr-only">Toggle</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    <div className="px-3 pb-3">
                                        <div className="text-xs text-muted-foreground flex gap-4 border-t pt-2 mt-2">
                                            <span>Category: {task.category}</span>
                                            <span>Ease: {task.easeOfCompletionScore}/10</span>
                                        </div>
                                        {task.subTasks && task.subTasks.length > 0 && (
                                            <>
                                                <p className="text-xs font-semibold text-muted-foreground mt-2">Sub-tasks:</p>
                                                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-1">
                                                    {task.subTasks.map((sub) => <li key={sub.description}>{sub.description}</li>)}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ))}
                </div>
              </ScrollArea>
            </div>
          );
      case 'error':
        return (
          <div className="py-4 text-center text-destructive">
            <p>An error occurred:</p>
            <p className="text-sm">{error}</p>
          </div>
        );
    }
  };

  const isNextDisabled = () => {
    if (isThinking) return true;
    if (step === 'initial' && !initialGoal.trim()) return true;
    if (step === 'clarifying') {
        if (!currentQuestion) return true;
        if (currentQuestion.type === 'multiple-choice' && !selectedOption) return true;
        if (currentQuestion.type === 'text' && !textAnswer.trim()) return true;
    }
    return false;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2 text-2xl">
            <Sparkles className="text-primary" /> Add a New Act
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
            {renderContent()}
            {error && step !== 'error' && (
              <p className="mt-2 text-right text-sm text-destructive">{error}</p>
            )}
        </div>
        <DialogFooter>
            {step === 'error' ? (
              <Button onClick={startOver}>Start Over</Button>
            ) : step === 'reviewing_tasks' ? (
              <>
                <Button variant="ghost" onClick={startOver} disabled={isThinking}>
                  Start Over
                </Button>
                <Button onClick={handleCreateAct} disabled={isThinking}>
                  {isThinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Act to Project
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isThinking}>
                  Cancel
                </Button>
                <Button onClick={handleNextClarification} disabled={isNextDisabled()}>
                  {isThinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === 'initial' ? 'Start Clarification' : 'Continue'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
