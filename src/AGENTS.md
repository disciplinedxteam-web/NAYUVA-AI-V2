# Care workflow invariants

- Lekha eligibility and eight-topic coverage are browser-safe deterministic domain rules; server handlers independently enforce eligibility and human approval because UI access is not authorization.
- Lekha recognized segments, editable notes, generated drafts and approved cards stay distinct in locked capture tables; revision checks prevent silent concurrent overwrites and the approval transaction is idempotent.
- The standalone appointment scheduler is shared by Milan and Lekha quick actions to avoid circular workspace imports.
- Local Lekha microphones capture only room audio without inferred speaker names; online conversations use consented Daily participant transcripts, never a guessed remote-audio capture.
- Taal uses persisted operational completion counts, not clinical risk or inferred attendance; its dialog can filter the supplied fortnight without changing the classification window.