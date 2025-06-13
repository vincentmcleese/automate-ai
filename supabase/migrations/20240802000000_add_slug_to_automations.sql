ALTER TABLE public.automations
ADD COLUMN slug TEXT;

CREATE UNIQUE INDEX automations_slug_idx ON public.automations (slug); 