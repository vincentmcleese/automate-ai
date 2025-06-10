-- Make the generated_json column nullable to allow for pending automations.
ALTER TABLE public.automations
  ALTER COLUMN generated_json DROP NOT NULL;

-- Also, ensure the user_input is not null, as it's essential for generation.
ALTER TABLE public.automations
  ALTER COLUMN user_input SET NOT NULL; 