
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <Target className={cn("h-6 w-6", iconClassName)} />
      <span className="font-headline text-2xl font-bold">Flothink</span>
    </div>
  );
}
