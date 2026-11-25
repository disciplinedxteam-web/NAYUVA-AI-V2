# Nayuva AI — Connected Newborn Care

**Team Baalak 2.0 · HackwithAditya**

🔗 **Live prototype:** https://health.nayuva.dev

Nayuva AI keeps newborn families and their hospital care team connected during the first 42 days after discharge. Parents speak with a voice assistant in their own language, and the care team receives structured, reviewable updates — every medical decision stays with a human clinician.

## How it works

1. The care team creates a **Care Plan** for a baby (topics to watch, check-in time, language).
2. The caregiver completes a daily voice check-in with **Svara** (on the website or by phone).
3. The conversation becomes a structured document the caregiver approves, then it reaches the care team's **Care Updates**, triaged as Priority / Review / Routine.
4. Visits are scheduled in **Milan**, documented by **Lekha**, explored with **Sutra**, and follow-through is tracked in **Taal**.

## Features

| Feature | What it does |
|---|---|
| **Svara** | Multilingual voice check-ins (web or phone call) that turn into structured topic cards. |
| **Milan** | Appointment scheduling, in-person or online (direct 1-on-1 video call). |
| **Lekha** | Listens during or after an appointment in any language and drafts a structured clinical document for the clinician to edit and approve. |
| **Sutra** | An assistant that answers questions only from the baby's own records, with clickable sources. |
| **Taal** | Shows which families are active, overdue or unresponsive with their check-ins and visits. |

## Tech stack

- TanStack Start (React 19, Vite 7), Tailwind CSS v4
- Sarvam AI — Conversational voice agent, Saarika speech-to-text, Bulbul text-to-speech, Sarvam LLM
- Lovable Cloud (Postgres database, row-level security, realtime signaling for WebRTC video)

## Run locally

Prerequisites: Node.js 20+ (or Bun) and Git.

```bash
git clone https://github.com/disciplinedxteam-web/NAYUVA-AI-V2.git
cd NAYUVA-AI-V2
npm install
npm run dev
```

Open http://localhost:8080.

Environment variables (server-side): `SARVAM_API_KEY`, `SARVAM_MODELS_API_KEY`, `SARVAM_APP_ID`, plus the backend URL and keys in `.env`. Without Sarvam keys the interface loads but voice, Lekha and Sutra will not respond — use the live prototype for the full experience.
