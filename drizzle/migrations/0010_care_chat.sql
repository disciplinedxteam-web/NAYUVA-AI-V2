CREATE TABLE public.care_chat_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 baby_id uuid NOT NULL REFERENCES public.care_profiles(id),
 name text NOT NULL DEFAULT 'file',
 mime text NOT NULL DEFAULT 'application/octet-stream',
 data text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.care_chat_files TO service_role;
ALTER TABLE public.care_chat_files ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.care_chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 baby_id uuid NOT NULL REFERENCES public.care_profiles(id),
 sender text NOT NULL CHECK (sender IN ('care-team','caregiver','system')),
 kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','voice','file','appointment','svara_card')),
 body text NOT NULL DEFAULT '',
 ref_id uuid,
 file_id uuid REFERENCES public.care_chat_files(id),
 read_by_team_at timestamptz,
 read_by_caregiver_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX care_chat_messages_baby_idx ON public.care_chat_messages(baby_id, created_at);
GRANT ALL ON public.care_chat_messages TO service_role;
ALTER TABLE public.care_chat_messages ENABLE ROW LEVEL SECURITY;