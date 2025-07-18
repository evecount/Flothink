
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestFirestorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setLog('');

    if (!user) {
        const errorMsg = "You must be logged in to run this test.";
        setError(errorMsg);
        setIsLoading(false);
        return;
    }

    if (!db) {
        const errorMsg = "Firestore database is not initialized. Check your firebase.ts configuration and .env file.";
        setError(errorMsg);
        setIsLoading(false);
        return;
    }
    
    setLog(`Attempting to write to 'test' collection as user: ${user.uid}...`);

    try {
      const docRef = await addDoc(collection(db, "test"), {
        uid: user.uid,
        createdAt: serverTimestamp(),
        message: "Hello, Firestore!"
      });
      setLog(`Write successful! Document ID: ${docRef.id}. Check your Firestore console for a 'test' collection.`);
      setSuccess(true);
      toast({
        title: "Test Successful!",
        description: "The document was written to Firestore.",
      });

    } catch (e: any) {
      const errorMessage = e.message || "An unknown error occurred.";
      console.error("Firestore write test failed with error object:", e);
      setLog(`Firestore write failed with code: ${e.code}. Message: ${errorMessage}`);
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Test Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Firestore Write Test</CardTitle>
            <CardDescription>
              This is a diagnostic tool. It performs the simplest possible action: writing one document to a "test" collection. If this fails, there is a fundamental configuration issue with your Firebase project or security rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={handleRunTest} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Run Write Test
            </Button>
            {log && (
                <div className="text-sm font-mono p-4 bg-muted/50 rounded-md w-full">
                    <p>{log}</p>
                </div>
            )}
            {error && (
                <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-md w-full flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5"/>
                    <p>{error}</p>
                </div>
            )}
            {success && (
                 <div className="text-green-600 font-medium p-4 bg-green-500/10 rounded-md w-full flex items-center gap-2">
                    <CheckCircle className="h-5 w-5"/>
                    <p>Success! You can now remove this test page.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
