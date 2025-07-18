
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Loader2, LogOut, Folder, LayoutDashboard, History, Play } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NewProjectDialog } from '@/components/dashboard/new-project-dialog';
import { Logo } from '@/components/logo';
import type { Project } from '@/lib/types';
import { getInitials } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, "projects"), where("ownerUid", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          userProjects.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(userProjects);
        setProjectsLoading(false);
      }, (error) => {
        console.error("Error fetching projects: ", error);
        setProjectsLoading(false);
      });
      return () => unsubscribe();
    } else if (!user && !loading) {
      setProjectsLoading(false);
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/session')}>
                <Link href="/dashboard/session">
                  <Play className="fill-current" />
                  <span>Focused Session</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard/completed'}>
                <Link href="/dashboard/completed">
                  <History />
                  <span>History</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {projectsLoading ? (
              <div className="p-2">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : projects.length > 0 ? (
              projects.map(project => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton asChild isActive={pathname === `/dashboard/project/${project.id}`}>
                    <Link href={`/dashboard/project/${project.id}`}>
                      <Folder />
                      <span>{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                <p>No projects yet. Create one to get started!</p>
              </div>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <NewProjectDialog />
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User Avatar'}/>
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate group-data-[collapsible=icon]:hidden">{user.displayName ?? 'User'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="group-data-[collapsible=icon]:hidden">
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <Logo />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
