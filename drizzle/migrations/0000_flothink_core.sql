CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Active',
  priority text NOT NULL DEFAULT 'MEDIUM',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT '',
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'General',
  ease_score int NOT NULL DEFAULT 3,
  stage text NOT NULL DEFAULT 'Backlog',
  due_date date,
  place text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX tasks_user_due ON public.tasks(user_id, due_date);