
'use client';

import { useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

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
import { Loader2, UploadCloud, FileUp } from 'lucide-react';

interface AddSourceDialogProps {
  projectId: string;
  children?: ReactNode;
}

export function AddSourceDialog({ projectId, children }: AddSourceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !user || !storage || !db) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No files selected or services unavailable.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `sources/${user.uid}/${projectId}/${file.name}`);
        const uploadTask = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        return {
          name: file.name,
          url: downloadURL,
        };
      });

      const newSources = await Promise.all(uploadPromises);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        sources: arrayUnion(...newSources),
      });

      toast({
        title: 'Success',
        description: `${newSources.length} source(s) have been added to the project.`,
      });
      setFiles([]);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to upload sources:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload the files.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline">
            <UploadCloud className="mr-2" />
            Add Source(s)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Sources</DialogTitle>
          <DialogDescription>
            Upload documents (e.g., briefs, notes, research) to give the AI more context about this project. You can select multiple files.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Label htmlFor="file-upload">Source Documents</Label>
            <div className="flex items-center justify-center w-full">
                <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                        {files.length > 0 ? (
                             <p className="font-semibold text-primary">{files.length} file(s) selected</p>
                        ) : (
                            <>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PDF, TXT, DOCX, etc.</p>
                            </>
                        )}
                    </div>
                    <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                </Label>
            </div> 
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={files.length === 0 || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload & Add Sources
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
