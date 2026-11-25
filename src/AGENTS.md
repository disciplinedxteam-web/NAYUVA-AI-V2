# Care workflow invariants

- Lekha eligibility and eight-topic coverage are browser-safe deterministic domain rules; server handlers independently enforce eligibility and human approval because UI access is not authorization.
- Lekha recognized segments, editable notes, generated drafts and approved cards stay distinct in locked capture tables; revision checks prevent silent concurrent overwrites and the approval transaction is idempotent.
- The standalone appointment scheduler is shared by Milan and Lekha quick actions to avoid circular workspace imports.
- Lekha live capture records room audio with no on-screen transcript or checklist (the checklist is after-visit only); speaker understanding happens when the document is generated, and quick actions open in the shared right-edge SidePanel (consult-tools), which reserves its width on the page through a body attribute so the main screen reflows instead of being covered. Lekha has no appointment time window — any non-cancelled in-person visit can be documented; online visits are native 1-on-1 WebRTC (Realtime broadcast signaling on a server-issued channel); each participant transcribes only its own mic via Sarvam, so speaker labels come from the server role.
- Taal uses persisted operational completion counts, not clinical risk or inferred attendance; its dialog can filter the supplied fortnight without changing the classification window.- Care cards show at most three metadata tags and never consultation content; documents are reached only via the shared DocumentActions (view/download/share the generated PDF), so card face and record cannot drift.
- Generated documents open in one shared viewer (LekhaDocument) with a top toolbar; review actions (Edit, Approve) appear only when an approve handler is passed, so history views stay read-only. Section tutorial pills float top-centre of the dashboard main area and never shift content.
- Below 768px the dashboard sidebar becomes a slide-out drawer opened from a menu button and closed on navigation; desktop sidebar rules stay untouched.
- Deleting a Care Plan is care-team only and removes every baby-linked row child-first in one server action, so no orphaned card, visit, Lekha or Sutra record survives.
- Sutra may cite only document records (Svara check-in cards and appointment summaries), enforced server-side; a card is one row, so reviewed and unreviewed states never duplicate.
- Dashboards use the multi-section sidebar layout (Care Team: Home, Care Updates, Milan, Lekha, Sutra, Care Plan, Taal; Caregiver: Home, Svara, Milan, Sutra, Emergency); the chat-first Converse view is retired for this track.
- Converse stores every message in locked `care_chat_messages` (server is the record, so automatic appointment and Svara-card messages can be posted from server actions); NextCon Chat SDK DirectChannels only carry live "new message" signals, with polling as fallback. Tokens are issued server-side from the App Key/Secret.
- Sutra books appointments only through the interactive card and `sutraSchedule` (deterministic intent detection adds the card; the model never books), reusing the same appointment insert as manual scheduling.

- Chat reactions are `care_chat_messages` rows of kind `reaction` (ref_id = target, one per sender), so they need no schema change and are excluded from unread counts and previews.
- "Ask Sutra" hands a record to Sutra through a window event: from History it waits as a draft attachment; from a Svara card in chat (Care Team) it carries a fixed question that Sutra sends once it is idle.
- A Svara card message stores the caregiver's short note in its body; Care Team approval goes through `approveSvaraCard`, which marks the card reviewed once and posts the clinician reply quoting the card, so double clicks never duplicate it. Automatic wording lives in `chat-messages.ts`.
- Chat replies store the quoted message id in `care_chat_messages.reply_to` (not `ref_id`, which belongs to appointments, cards and reactions); the "New messages" divider uses `firstUnread` computed by getChat before it marks messages read.
- Profile photos are shared presentation only, stored in facility settings (team photo plus one per caregiver profile) and filtered per role on read, so each side sees only the photos relevant to them.
- Hero CTAs always pass through a judge guide (Care Team directly, Caregiver after profile selection); the guide is shown on every entry and stores nothing.

- Converse uses a browser MediaRecorder voice-note hook with preview and explicit send; Sutra alone retains dictation, so human chat audio is never transcribed.
- Judge guides reuse the homepage Platform chat animations (`platform-demos.tsx`, role variants) and store nothing; the tutorial button sits in the content, the continue button bottom-right.

- Reset care-data and thread caches before displaying a newly opened demo session, preventing the previous caregiver’s cached settings from flashing.
