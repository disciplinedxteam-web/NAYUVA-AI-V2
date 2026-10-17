CREATE TABLE public.online_appointments (appointment_id uuid PRIMARY KEY REFERENCES public.care_appointments(id) ON DELETE CASCADE, room_name text UNIQUE NOT NULL, room_url text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'provisioning', failure_message text, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.online_appointments TO service_role;
ALTER TABLE public.online_appointments ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.online_participation (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL REFERENCES public.online_appointments(appointment_id) ON DELETE CASCADE, role text NOT NULL, profile_id uuid, consent_at timestamptz NOT NULL DEFAULT now(), UNIQUE(appointment_id,role));
GRANT ALL ON public.online_participation TO service_role;
ALTER TABLE public.online_participation ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.appointment_transcripts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL REFERENCES public.online_appointments(appointment_id) ON DELETE CASCADE, event_key text NOT NULL, speaker text NOT NULL, content text NOT NULL, spoken_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(appointment_id,event_key));
GRANT ALL ON public.appointment_transcripts TO service_role;
ALTER TABLE public.appointment_transcripts ENABLE ROW LEVEL SECURITY;