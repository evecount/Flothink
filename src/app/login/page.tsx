
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth state is resolved and we have a user, redirect to the dashboard.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // While loading auth state, or if we have a user and are about to redirect, show a spinner.
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Otherwise, show the login form.
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card/50 p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4" iconClassName="h-10 w-10" />
          <h1 className="font-headline text-3xl font-bold text-primary">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to orchestrate your next breakthrough.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
