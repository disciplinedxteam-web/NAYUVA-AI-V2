CREATE TABLE public.sutra_conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), baby_id uuid NOT NULL REFERENCES public.care_profiles(id) ON DELETE CASCADE, workspace text NOT NULL DEFAULT 'hackathon-demo', audience text NOT NULL CHECK (audience IN ('care-team','caregiver')), title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.sutra_conversations TO service_role;
ALTER TABLE public.sutra_conversations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.sutra_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES public.sutra_conversations(id) ON DELETE CASCADE, role text NOT NULL CHECK (role IN ('user','assistant')), content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.sutra_messages TO service_role;
ALTER TABLE public.sutra_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX sutra_conversation_scope ON public.sutra_conversations(baby_id,audience,updated_at DESC);
CREATE INDEX sutra_message_order ON public.sutra_messages(conversation_id,created_at);
COMMENT ON TABLE public.sutra_conversations IS 'Demo workspace only. RLS locked; access exclusively through validated HttpOnly capability server functions scoped to baby and audience.';