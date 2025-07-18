
'use client';

import { useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { ProjectMember } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';

interface InviteMemberDialogProps {
  projectId: string;
  currentMembers: ProjectMember[];
  children: ReactNode;
}

export function InviteMemberDialog({ projectId, currentMembers, children }: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email || !user || !db) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email is required or services unavailable.',
      });
      return;
    }

    if (currentMembers.some(member => member.email === email)) {
        toast({
            variant: "destructive",
            title: "Already a member",
            description: "This user is already part of the project.",
        });
        return;
    }

    setIsLoading(true);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'User Not Found',
          description: `No user with the email "${email}" was found. Make sure they have an account.`,
        });
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const newMember = { ...userDoc.data(), role: 'member' } as ProjectMember;

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        members: arrayUnion(newMember),
        memberUids: arrayUnion(newMember.uid),
      });

      toast({
        title: 'Success!',
        description: `${newMember.displayName || newMember.email} has been added to the project.`,
      });
      setEmail('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      toast({
        variant: 'destructive',
        title: 'Invite Failed',
        description: error.message || 'Could not invite the user. To enable this, you may need to create a Firestore index. The console will provide a link if this is the case.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a New Member</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to add to this project. They must have a Flothink account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                    id="email" 
                    type="email"
                    placeholder="teammate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!email || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
