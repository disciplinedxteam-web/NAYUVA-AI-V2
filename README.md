# Nayuva AI

Nayuva AI keeps parents and the hospital care team connected after a newborn goes home, with one simple chat, daily voice check-ins and quick answers from the baby's records.

Live demo: https://nayuva.dev

## Nexconn Build Challenge: how Nexconn is used

Nexconn Chat SDK is the real-time messaging backbone of **Care Connect**, the 1-on-1 chat between each caregiver and the care team.

| What | Where |
| --- | --- |
| SDK packages | `package.json`: `@nexconn/chat`, `@nexconn/engine` |
| Client engine lifecycle (`NCEngine.initialize`, `NCEngine.connect`, message handlers) | `src/components/converse/use-nexconn.ts` |
| Secure server-side access-token issuing (App Key + signed App Secret) | `src/lib/care.functions.ts` (`getNexconnToken`) |
| 1-on-1 `DirectChannel` messaging in the chat UI | `src/components/converse/converse.tsx` |

Flow:
1. The server issues a Nexconn access token for the signed-in demo role (secret never reaches the browser).
2. The browser connects with `NCEngine.connect({ token })`.
3. Each caregiver and the care team talk over a Nexconn `DirectChannel`; incoming events update the chat instantly.
4. Messages are also saved on our server so history, Svara cards and appointment cards stay in one record.

## Main features

- **Care Connect**: text, photos, videos, voice notes, documents, reactions and replies.
- **Svara**: daily voice check-in that creates a health card the care team can approve.
- **Sutra AI**: answers questions only from the baby's own records, with clickable sources.
- **Online consultations**: full-screen video visits with an AI-drafted, doctor-approved summary.

## Tech stack

TanStack Start (React 19, Vite), Tailwind CSS, Lovable Cloud backend, Nexconn Chat SDK, Sarvam AI voice.

## Run locally

```sh
npm install
npm run dev
```
