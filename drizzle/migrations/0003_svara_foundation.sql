ALTER TABLE public.care_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.care_profiles ADD COLUMN IF NOT EXISTS plan_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.care_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.health_cards ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.health_cards ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'Pending review';
ALTER TABLE public.health_cards ADD COLUMN IF NOT EXISTS summary_version integer NOT NULL DEFAULT 1;

CREATE TABLE public.question_bank (
  id text PRIMARY KEY,
  topic text NOT NULL,
  first_wording text NOT NULL,
  returning_wording text,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_type text NOT NULL DEFAULT 'free_text',
  answer_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_confirmation boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'pending',
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.topic_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.care_profiles(id) ON DELETE CASCADE,
  plan_version integer NOT NULL,
  topic text NOT NULL,
  frequency text NOT NULL,
  checkin_time text NOT NULL,
  start_date date,
  end_date date,
  last_completed_at timestamptz,
  next_due_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (baby_id, topic)
);
CREATE TABLE public.followup_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.care_profiles(id) ON DELETE CASCADE,
  plan_version integer NOT NULL,
  clinician text NOT NULL,
  topic text,
  instruction text NOT NULL,
  question_id text REFERENCES public.question_bank(id),
  starts_on date,
  expires_on date,
  status text NOT NULL DEFAULT 'active',
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.checkin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.care_profiles(id) ON DELETE CASCADE,
  caregiver_name text NOT NULL,
  plan_version integer NOT NULL,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  channel text NOT NULL DEFAULT 'website_voice',
  status text NOT NULL DEFAULT 'scheduled',
  agent_version text,
  question_bank_version integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.caregiver_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
  baby_id uuid NOT NULL REFERENCES public.care_profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  topic text NOT NULL,
  original_text text,
  structured_answer jsonb,
  units text,
  confirmation_status text NOT NULL DEFAULT 'unconfirmed',
  validation_status text NOT NULL DEFAULT 'pending',
  completeness text NOT NULL DEFAULT 'answered',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.trigger_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL DEFAULT 1,
  topic text,
  question_id text REFERENCES public.question_bank(id),
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  workflow_action text,
  review_destination text,
  approval_status text NOT NULL DEFAULT 'pending',
  effective_from date,
  effective_to date,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  actor_role text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.topic_schedules (baby_id);
CREATE INDEX ON public.checkin_sessions (baby_id, status);
CREATE INDEX ON public.caregiver_responses (session_id);
CREATE INDEX ON public.followup_instructions (baby_id, status);
CREATE INDEX ON public.audit_log (entity, entity_id);

GRANT ALL ON public.question_bank, public.topic_schedules, public.followup_instructions, public.checkin_sessions, public.caregiver_responses, public.trigger_rules, public.audit_log TO service_role;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.audit_block_changes() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only'; END $$;
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_block_changes();

INSERT INTO public.question_bank (id, topic, first_wording, response_type, requires_confirmation, approval_status)
VALUES ('caregiver-concern-final', 'Caregiver concerns', 'Before we finish, is there anything about your baby that has been worrying you or that you''d like the care team to know?', 'open_text', false, 'approved')
ON CONFLICT (id) DO NOTHING;