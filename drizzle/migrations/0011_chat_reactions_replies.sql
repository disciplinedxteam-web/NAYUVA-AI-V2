ALTER TABLE public.care_chat_messages DROP CONSTRAINT IF EXISTS care_chat_messages_kind_check;
ALTER TABLE public.care_chat_messages ADD CONSTRAINT care_chat_messages_kind_check CHECK (kind = ANY (ARRAY['text','voice','file','appointment','svara_card','reaction']));
ALTER TABLE public.care_chat_messages ADD COLUMN IF NOT EXISTS reply_to uuid;