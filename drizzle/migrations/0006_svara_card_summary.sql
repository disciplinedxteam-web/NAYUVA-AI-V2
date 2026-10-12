ALTER TABLE public.health_cards ADD COLUMN IF NOT EXISTS summary_text text;
ALTER TABLE public.health_cards ADD COLUMN IF NOT EXISTS scoring_result jsonb;
CREATE OR REPLACE FUNCTION public.confirm_svara_card(p_session uuid,p_baby uuid,p_summary text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.checkin_sessions%ROWTYPE; card_id uuid; original_text text;
BEGIN
 SELECT * INTO s FROM public.checkin_sessions WHERE id=p_session AND baby_id=p_baby FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Check-in unavailable'; END IF;
 SELECT id INTO card_id FROM public.health_cards WHERE session_id=s.id;
 IF card_id IS NOT NULL THEN RETURN card_id; END IF;
 IF s.summary IS NULL OR p_summary IS NULL OR length(trim(p_summary))=0 OR length(p_summary)>5000 THEN RAISE EXCEPTION 'Review required'; END IF;
 SELECT string_agg(x->>'content', E'\n' ORDER BY ord) INTO original_text FROM jsonb_array_elements(s.transcript) WITH ORDINALITY AS t(x,ord) WHERE x->>'role'='user';
 IF original_text IS NULL THEN RAISE EXCEPTION 'Caregiver responses required'; END IF;
 INSERT INTO public.health_cards(baby_id,session_id,category,quote,observation,priority,workflow_status,caregiver_name,plan_snapshot,scheduled_for,summary_text,scoring_result) VALUES(s.baby_id,s.id,'Caregiver concerns',original_text,'Not recorded','Review Needed','Pending review',s.caregiver_name,s.plan_snapshot,s.scheduled_for,p_summary,'{"matchedRules":[],"reason":"No clinician-approved trigger rules applied"}'::jsonb) RETURNING id INTO card_id;
 UPDATE public.checkin_sessions SET summary=summary||jsonb_build_object('summary',p_summary,'caregiverConfirmed',true),status='submitted',completed_at=now() WHERE id=s.id;
 INSERT INTO public.care_events(baby_id,kind,summary) VALUES(s.baby_id,'Home Update',p_summary);
 RETURN card_id;
END $$;
REVOKE ALL ON FUNCTION public.confirm_svara_card(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_svara_card(uuid,uuid,text) TO service_role;