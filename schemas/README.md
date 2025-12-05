Canonical v0.1 Zod schemas for afi-core.

Primary schemas:
- `universal_signal_schema.ts` — canonical v0.1 `SignalSchema` used by validators and runtime types.
- `pipeline_config_schema.ts` — canonical v0.1 pipeline configuration for signal engines and transports.
- `signal_finalization_request_schema.ts` — v0.1 request object for signal finalization; runtime metrics only (no UWR override).
- `validator_metadata_schema.ts` — v0.1 validator metadata for registries; see `afi-infra/agent-roles/validator_metadata_v1.md` for evolution.
- `validator_governance_schema.ts` — v0.1 governance participation snapshot for validators.

Legacy/design artifacts:
- Any `*.backup.ts` (e.g., staged pipeline schemas) are kept for reference only and must NOT be exported from `schemas/index.ts` or used for new runtime logic.
