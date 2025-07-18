
'use client';

import { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleGoogleSignIn() {
    setIsLoading(true);
    if (!auth || !db) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description: 'Firebase is not configured. Check the .env file.',
      });
      setIsLoading(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        },
        { merge: true }
      );
      // No longer need to manually redirect. The auth state change will trigger it.
    } catch (error: any) {
      let title = 'Google Sign-Up Failed';
      let description = `An unexpected error occurred. Code: ${error.code || 'UNKNOWN'}`;

      if (error.code === 'auth/popup-blocked') {
        title = 'Popup Blocked';
        description = "Your browser blocked the sign-up popup. Please allow popups for this site and try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        const unauthorizedDomain = window.location.hostname;
        title = 'Domain Not Authorized';
        description = `This app's domain (${unauthorizedDomain}) is not authorized. In the Firebase Console, go to Authentication > Settings > Authorized domains and add this domain.`;
      } else if (error.code === 'auth/operation-not-allowed') {
        title = 'Sign-in Method Disabled';
        description = "Google Sign-In is not enabled for this project. In the Firebase Console, go to Authentication > Sign-in method and enable the Google provider.";
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
            <path
              fill="currentColor"
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-5.18 0-9.4-4.22-9.4-9.4s4.22-9.4 9.4-9.4c2.6 0 4.38 1.02 5.7 2.23l2.42-2.33C19.49 1.45 16.46 0 12.48 0 5.88 0 .04 5.88.04 12.48s5.84 12.48 12.44 12.48c3.38 0 6.2-1.1 8.25-3.25 2.1-2.1 2.85-5.05 2.85-7.84 0-.73-.06-1.42-.18-2.08H12.48z"
            ></path>
          </svg>
        )}
        Sign up with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
