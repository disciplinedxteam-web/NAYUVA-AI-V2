# Roadmap

## Current request: Chat-first dashboard redesign
- [x] Two-view dashboards (Converse / Sutra AI), single tutorial button per role, Lekha/Taal removed
- [x] Converse via NextCon Chat SDK with text, voice notes, documents, pinned appointment (join/cancel/reschedule)
- [x] Care Team caregiver picker with search and unread counts
- [x] Sutra scheduling card with approve, automatic message and pinned appointment
- [x] Caregiver Svara banner above Sutra; approved Health Cards posted into Converse
- [ ] Real two-person live chat and a full online visit from the new pinned card — needs two people on two devices

## Current request: Phone completion timing
- [x] Show writing as soon as the completed-call status arrives; check immediately and every second without overlapping requests
- [x] Open the caregiver draft as soon as it is ready, with no extra phone-only animation delay
- [x] Show early-ended calls as a retry notification; preserve calling, qualification and explicit approval
- [x] Run synthetic timing and phone review regressions (19 targeted tests passed)

## Current request: Svara phone review
- [x] Preserve call initiation and protocol; stop automatic phone document delivery
- [x] Reuse writing animation and editable caregiver review after phone completion
- [x] Verify approval, incomplete calls and regressions with synthetic tests (105 passing); existing care records unchanged
- [ ] Verify a real phone call through caregiver approval — requires an actual consented call; no call placed during this change

## Current: Lekha and Taal
- [x] Connect authorized persistent live/post-visit capture, consent, draft and approval
- [x] Redesign Lekha choices, chat capture, eight-topic checklist and quick-action drawers
- [x] Redesign surfaced Taal table and immediate activity detail dialog
- [x] Verify eligibility, saved-note resume, quick-action controls and targeted tests
- [ ] Verify real Sarvam speech and generated-card approval end-to-end — needs available Sarvam credits and an actual consented conversation

## Sutra redesign
- [ ] Replace legacy Sutra layout with reference greeting, composer and single-row shortcuts
- [ ] Implement character-led first-message motion and normal subsequent-message indicator
- [ ] Connect live editable dictation and attachments
- [ ] Persist authorized dated conversations and resume from right-side history
- [ ] Refine grounded friendly answers and verify both roles

## Svara UI/UX
- [ ] Choose screen: compact, centered, no scroll when CTA trays open
- [ ] Greeting video (Namaskar) plays once, then looking-around video loops; remove orb/wave; backgroundless; same size
- [ ] Phone input: +91 inside one input frame, aesthetic
- [ ] Voice screen: more spacing above disconnect, larger character video, wider horizontal transcript gaps
- [ ] Trim last 1.5s of speaking video
- [ ] Functional hold + mute buttons
- [ ] Svara always available (remove due gating)
- [ ] Incomplete/left calls: no card, restart from fresh state
- [ ] Completion video (2.4s) plays fully before redirect home
- [ ] Phone stage shows looking-around video instead of orb

## Caregiver Home dashboard
- [ ] Full redesign per uploaded markdown (Svara card, appointments w/ availability action, Sutra shortcut w/ 3 suggested questions, analytics, activity calendar w/ split-color days, appointment notes/Lekha section, recent card status timeline)

## Cards
- [ ] Replace all card UI with uploaded 381-line component (ShineBorder), white card, light-pink inner tags, pink CTA, remove stamp

## Sidebar / chrome
- [ ] Fix sidebar not collapsing after selecting a section
- [ ] Remove "Clinical decisions remain with your care team / IST" footer text everywhere
