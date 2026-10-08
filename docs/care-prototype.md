# Nayuva care prototype

Public fixed demos open Dr. Ananya Rao or Meera Sharma without signup. All records in this workspace are shared synthetic demonstration data. Do not enter real patient information. This is not production healthcare authentication or a clinical decision system.

Server-issued HttpOnly cookies contain opaque demo capabilities; only token hashes, role and expiry are stored. Clinical tables deny direct browser access through RLS. Server functions validate inputs, demo role, workspace and caregiver profile access. Public demo entry is intentionally open, not an identity verification process.

Care plans are structured editable forms. Svara’s typed transcript and optional browser speech recognition are reviewed before submission; simple deterministic text matching suggests an editable observation. Explicit workflow rules assign communication review priority, never clinical risk. Lekha starts with the clinician’s own text and requires clinician-entered decisions. No Sarvam calls are made. `sarvam-contract.ts` defines a future shared adapter, product instructions and strict output schemas; production integration must validate provider output and approved categories before storing it.

Milan preserves original appointment times when caregivers request rescheduling. Completed appointments are available in Lekha. Saved reviews, appointments and documentation appear in Sutra. Facility settings supply appointment locations and direct emergency contacts without triage.

The public demos use polling for shared updates. Multi-record writes are currently sequential; production deployment should use database transactions, verified caregiver membership, audit logging, retention controls and a formal privacy/security review.