# ValidatorDecision Spec v0.1 (Implementation-Adjacent Stub)

This document describes the **validator-facing decision envelope** used in `afi-core` types. It ties together scoring output, novelty evaluation, optional regime tagging, and the decision payload that validators emit for audit/replay. This is not the canonical protocol spec (that will live in `afi-docs`); it is a lightweight reference for implementers.

Canonical metadata schema: see `afi-infra/agent-roles/validator_metadata_v1.md` in the AFI-Infra repo.

## Contract Overview

- `ValidatorDecisionBase` captures:
  - `signalId`, `validatorId`, `decision` (approve | reject | flag | abstain)
  - `uwrConfidence`: scalar in [0,1] produced by UWR logic elsewhere (not defined here)
  - `regimeTag?`: should align with `macro.regimeTag` from the uSignal schema (afi-config)
  - `novelty?`: `NoveltyResult` per NoveltySpec v0.1 (validator-facing, deterministic)
  - `reasonCodes?`: machine-readable tags (e.g., `["low-novelty", "conflict-with-baseline"]`)
  - `notes?`: free-text justification
  - `createdAt`: ISO timestamp for audit/replay

- `ValidatorOutcome` is an optional wrapper for downstream consumers:
  - `mintEligible`, `mintReason?`
  - `replaySessionId?` (link to future replay sessions)
  - `decision`: the `ValidatorDecisionBase`

## Position in Flow

- Consumed by validators after scoring and novelty evaluation, before mint gating.
- Provides a deterministic envelope for replay and audit; does **not** define emissions, tokenomics, or PoI/PoInsight formulas.
- `uwrConfidence` references UWR outputs but this file does **not** implement UWR.
- PoI (Proof-of-Intelligence) and PoInsight (Proof-of-Insight) are validator-level traits only; they are not per-signal metrics. PoI/PoInsight and any reputation scores may influence validator selection/weighting, but must never override UWR or vault finality for already-scored/recorded signals.

## Notes

- Novelty comes from `NoveltyResult` (NoveltySpec v0.1).
- Regime tagging should be consistent with the macro lens (`macro.regimeTag`) defined in the uSignal schema (afi-config).
- This stub exists locally to keep validator-facing types aligned until the canonical spec is published in `afi-docs`.
