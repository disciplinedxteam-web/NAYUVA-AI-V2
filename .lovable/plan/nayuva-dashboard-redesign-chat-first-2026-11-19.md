# Nayuva dashboard redesign: chat-first

Home page stays exactly as it is. Only the Care Team and Caregiver dashboards change.

## 1. Shared layout (both roles)
- No feature sidebar. A glass toggle sits at the top centre: **Converse with Caregiver / Care Team** | **Sutra AI**.
- One tutorial button per role: "Watch Care Team Tutorial" / "Watch Caregiver Tutorial", same design and position as today.
- Lekha and Taal are removed from navigation and screens (stored records are kept, not deleted).

## 2. Converse (WhatsApp-style, NextCon Chat SDK)
- Our server issues each user a NextCon access token (App Key + App Secret stay server-side); the browser connects and uses a 1-to-1 channel per baby (care team <-> caregiver).
- Our own look: pink theme bubbles, composer fixed at bottom with attach document, mic voice message, send.
- Header shows the selected baby and caregiver.
- **Pinned bar** at the top shows the next appointment card (small version of today's card) with Join online (existing WebRTC call) and Cancel.
- Automatic messages: appointment created/cancelled, Svara Health Card approved by caregiver (card opens in the existing document viewer).
- Caregiver: no sidebar, talks to their care team.

## 3. Care Team profile sidebar
- Becomes a caregiver/baby picker with search and unread badges ("2 new").
- Picking a baby closes the sidebar and switches both Converse and Sutra AI to that baby.

## 4. Sutra AI (same look, character, loader and bottom composer)
- Sarvam LLM, multilingual, answers from the baby's records with clickable sources (as now).
- Becomes an agent: "Schedule an appointment for Aarav" returns a reply plus an interactive card: calendar date, time slots, reason, online/in-person, Approve.
- Approve sends an automatic message from the user ("Schedule 21 Nov, 10:30, online, feeding review"), Sutra books it with the existing scheduling rules, and the appointment appears pinned in Converse.
- Online visit flow unchanged: call, document generated, care team reviews/edits/approves in the existing viewer, saved to history.
- Chat history: New chat + past chats, kept separately per baby. A fresh site visit opens a new chat; switching tabs within a visit reopens the same chat.

## 5. Caregiver Sutra AI: Svara banner
- Small, always-visible card above the Sutra character: today's date/time, "Today's Svara check-in", buttons Talk on website / Get a phone call.
- Opens the existing Svara screens unchanged (voice, phone, writing animation, review, approve).
- On approval the Health Card is also posted into the Converse chat.

## Not changed
Svara voice/phone logic, Care Plan rules, document viewer, WebRTC calls, home page, existing data.

## Technical details
- New `NEXCONN_APP_KEY`/`NEXCONN_APP_SECRET` (saved). Server fn signs `/v4/auth/access-token/issue`; user IDs derived from demo session (care team id / caregiver profile id).
- Our database keeps a mirror of chat messages (for automatic system messages, pins, unread counts and Sutra sources) since automated messages are sent server-side.
- Sutra tool-calling: server returns structured `schedule_proposal` blocks rendered as picker cards; booking reuses current appointment validation.
- Per-baby Sutra conversations reuse existing tables, keyed by baby; sessionStorage remembers the open chat.
- Build order: shell + toggle + removals, NextCon chat, pinned appointments, Sutra scheduling agent, Svara banner and auto-posting, tests.

## GitHub note
Commit history cannot be rewritten here; for a fresh-looking public repo, push the current code as a single first commit to a new GitHub repository.
