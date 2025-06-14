create or replace function public.claim_pending_automation(
  pending_automation_id uuid,
  user_id_to_claim uuid,
  user_email_to_claim character varying,
  user_name_to_claim character varying,
  user_avatar_to_claim character varying
)
returns uuid -- The ID of the new automation
language plpgsql
security definer
as $$
declare
  pending_record record;
  new_automation_id uuid;
begin
  -- 1. Find the pending automation and lock the row for this transaction
  select *
  into pending_record
  from public.pending_automations
  where id = pending_automation_id
  for update;

  -- 2. If it doesn't exist, raise an exception.
  if not found then
    raise exception 'Pending automation with ID % not found', pending_automation_id;
  end if;

  -- 3. Create the new automation record from the pending data
  insert into public.automations (user_id, user_input, status, user_email, user_name, user_avatar_url)
  values (user_id_to_claim, pending_record.user_input, 'generating', user_email_to_claim, user_name_to_claim, user_avatar_to_claim)
  returning id into new_automation_id;

  -- 4. Delete the original pending automation
  delete from public.pending_automations
  where id = pending_automation_id;

  -- 5. Return the new automation's ID
  return new_automation_id;
end;
$$; 