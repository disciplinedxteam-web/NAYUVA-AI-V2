CREATE TABLE public.lekha_captures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 appointment_id uuid NOT NULL UNIQUE REFERENCES public.care_appointments(id),
 baby_id uuid NOT NULL REFERENCES public.care_profiles(id),
 mode text NOT NULL DEFAULT 'after' CHECK (mode IN ('live','after')),
 status text NOT NULL DEFAULT 'capturing' CHECK (status IN ('capturing','paused','ended','review','approved')),
 consent_at timestamptz,
 plan_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 original_segments jsonb NOT NULL DEFAULT '[]'::jsonb,
 edited_notes text NOT NULL DEFAULT '',
 draft_card jsonb,
 approved_card jsonb,
 revision bigint NOT NULL DEFAULT 0,
 started_at timestamptz NOT NULL DEFAULT now(),
 ended_at timestamptz,
 approved_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lekha_captures TO service_role;
ALTER TABLE public.lekha_captures ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.lekha_captures IS 'Demo workspace clinical documentation; server-validated care-team capabilities only. Raw audio is transient; original recognized segments remain distinct from edited notes and reviewed cards.';
CREATE TABLE public.lekha_segments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 capture_id uuid NOT NULL REFERENCES public.lekha_captures(id),
 event_key uuid NOT NULL,
 speaker text NOT NULL DEFAULT 'Conversation',
 content text NOT NULL,
 spoken_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(capture_id,event_key)
);
GRANT ALL ON public.lekha_segments TO service_role;
ALTER TABLE public.lekha_segments ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.approve_lekha_capture(p_capture uuid, p_card jsonb, p_decision text, p_followup text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.lekha_captures; n uuid;
BEGIN
 SELECT * INTO c FROM public.lekha_captures WHERE id=p_capture FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Capture unavailable'; END IF;
 IF c.status='approved' THEN SELECT id INTO n FROM public.clinical_notes WHERE appointment_id=c.appointment_id ORDER BY created_at DESC LIMIT 1; RETURN n; END IF;
 IF c.status<>'review' OR c.ended_at IS NULL OR c.draft_card IS NULL THEN RAISE EXCEPTION 'Review an ended appointment first'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.care_appointments WHERE id=c.appointment_id AND baby_id=c.baby_id AND status='Completed') THEN RAISE EXCEPTION 'Appointment must be completed'; END IF;
 IF EXISTS (SELECT 1 FROM public.clinical_notes WHERE appointment_id=c.appointment_id) THEN RAISE EXCEPTION 'Appointment already documented'; END IF;
 INSERT INTO public.clinical_notes(baby_id,appointment_id,observations,decision,follow_up) VALUES(c.baby_id,c.appointment_id,p_card::text,p_decision,p_followup) RETURNING id INTO n;
 UPDATE public.lekha_captures SET status='approved',approved_card=p_card,approved_at=now(),updated_at=now() WHERE id=c.id;
 INSERT INTO public.care_events(baby_id,kind,summary,caregiver_visible) VALUES(c.baby_id,'Clinical Note','Clinician-reviewed appointment documentation saved to Sutra',false);
 IF length(p_followup)>0 THEN INSERT INTO public.care_events(baby_id,kind,summary,caregiver_visible) VALUES(c.baby_id,'Follow-up',p_followup,true); END IF;
 INSERT INTO public.audit_log(entity,entity_id,action,actor_role,detail) VALUES('lekha_capture',c.id::text,'approved','care-team',jsonb_build_object('appointment_id',c.appointment_id,'note_id',n));
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.approve_lekha_capture(uuid,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approve_lekha_capture(uuid,jsonb,text,text) TO service_role;