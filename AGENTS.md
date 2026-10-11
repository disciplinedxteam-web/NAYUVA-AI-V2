<!-- LOVABLE:BEGIN -->
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
