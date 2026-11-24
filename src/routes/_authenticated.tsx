import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Screen><p className="m-auto relative z-10">Loading…</p></Screen>;
  if (!session) return <Navigate to="/login" />;
  return <Outlet />;
}
