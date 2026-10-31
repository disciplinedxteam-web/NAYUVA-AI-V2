<!-- LOVABLE:BEGIN -->
- Sarvam model APIs (STT/LLM/TTS) go through src/lib/sarvam.server.ts with SARVAM_MODELS_API_KEY; outbound calls use X-API-Key on apps.sarvam.ai — the two keys/headers differ.
- Svara phone results are saved as drafts; only caregiver confirmation creates a Health Card.
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared care illustrations in a browser-safe reusable component so solution and impact cards use the same accessible, reduced-motion-aware visual system.
- Frame team portraits with per-image presentation classes so unequal source crops render at one consistent visual scale.
- Keep decorative blooms at unclipped section side edges, with horizontal clipping only on the page shell, so flowers do not split at section boundaries.
- Keep product character demonstrations in a standalone browser-safe SVG component with semantic accent tokens and reduced-motion fallbacks; this avoids a missing external animation dependency.
- Keep scroll behavior and the language menu in a shared header component; translations remain disabled until actual translated content is supplied.
- Demo access uses server-issued HttpOnly session capabilities stored as hashes with role and expiration; public demos never authorize real patient data.
- All demo clinical tables are RLS-locked and accessed only by validated server functions scoped to the demo workspace and caregiver relationship, because URL roles must not grant permissions.
- Keep care configuration and deterministic workflow rules in a shared domain module, and product AI providers behind one future validated integration boundary; clinical decisions remain human-entered.
- Dashboard product views share one browser-safe shell and focused care form/capture components, with separate role URLs so the website and two workflows stay consistent.

- Derive scheduled check-in slots in the shared care domain and enforce them again on server submission; a unique baby/slot index prevents simultaneous duplicate submissions.
- Preserve caregiver demo capabilities on navigation; only the public synthetic-profile entry may issue a selected caregiver session.
- Render medical assistant characters from one browser-safe SVG component with optional working state and reduced-motion styles.
- Svara voice sessions use the Sarvam Web SDK through the server proxy /api/sarvam/, which requires a caregiver demo session and forces the user identifier to that caregiver's profile, so the API key and identity never come from the browser.
- Milan and Lekha share workspace controls; Sutra composes AI Elements and a browser-safe JourneyCarousel so chat layout and hanging journey navigation remain independent.
- Lekha's checklist ticks come from deterministic keyword detection in a shared module, never an AI judgement, so clinicians can predict and trust it.
- Sutra's assistant runs server-side and answers only from the authorized baby's persisted journey (clinical notes only for care team), so it cannot leak or invent records.
- Svara and Lekha summaries are structured topic cards (shared `care-card` module) stored as JSON text with an AI-suggested Priority/Review/Routine category that never defaults to Routine, so both products render and triage identically.
- Sarvam agent tools call `/api/public/sarvam-questions` and `/api/public/sarvam-observations`, keyed by the live check-in id (optional `SVARA_TOOL_KEY` header), so personalisation comes from the baby's Care Plan and history, not the agent prompt.
- Both Svara channels send only registered variables through svara-agent-contract; the agent retrieves snapshot-scoped approved questions and history using check_in_id so undeclared context cannot reject a call.
- Approval cards across Svara, Lekha, Milan and Sutra use the shared `CareTicket` component (stub = action, stamp = approved/reviewed; Sutra hides the stub), and all segmented toggles use `GlassToggle`.
- Sutra dated conversations and messages persist in RLS-locked tables accessed by validated demo-capability server functions scoped to baby and audience; history sent to the model is read server-side, never trusted from the browser.
- Sutra uses a dedicated browser-safe workspace with document text extraction and dictation hooks; its first-turn character motion is separate from the reference composer and response layout.
- Caregiver Home uses the vendored DraggableWidgetGrid with per-browser saved order, so rearranging never touches care data.
- Svara's daily questions come from the shared Day 1–42 protocol module (day of life from DOB in India time plus condition observation prompts); the brief travels in the registered `session_type` variable and the questions tool, because the published agent rejects unregistered variables.
- Workspace search is the shared SearchToggle that expands over its toggle, so every list keeps one consistent search pattern.
- Care Team Home reuses the caregiver bento widget grid in its own component with a separate saved layout key, so both roles share one look while widgets stay role-specific.
- Profile photo and display preferences live in per-browser storage only, so they never alter care records.

- Subdirectories have their own `AGENTS.md`; read them before changing files there.
- Sutra answers end with a model SOURCES line that the server validates against the baby's record ids and stores as a [[sources:...]] marker; the chat renders it as clickable source pills, never inline brackets. Sutra dictation uses Sarvam STT only.
- Character clips are pre-keyed alpha WebM files rendered only through the shared CharacterVideo component (looping, muted, non-interactive), so every product character shares one size reference and never shows a background box.
