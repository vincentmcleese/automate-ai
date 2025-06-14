create table "public"."pending_automations" (
    "id" uuid not null default gen_random_uuid(),
    "user_input" text not null,
    "selected_tools" jsonb,
    "validation_result" jsonb,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."pending_automations" enable row level security;

CREATE UNIQUE INDEX pending_automations_pkey ON public.pending_automations USING btree (id);

alter table "public"."pending_automations" add constraint "pending_automations_pkey" PRIMARY KEY using index "pending_automations_pkey";
