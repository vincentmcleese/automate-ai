ALTER TABLE public.automations
DROP CONSTRAINT automations_status_check;

ALTER TABLE public.automations
ADD CONSTRAINT automations_status_check CHECK (
  status IN ('pending', 'generating', 'completed', 'failed', 'generating_workflow')
); 