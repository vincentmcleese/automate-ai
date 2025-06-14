CREATE POLICY "Allow public insert for pending automations"
ON "public"."pending_automations"
FOR INSERT
WITH CHECK (true);
