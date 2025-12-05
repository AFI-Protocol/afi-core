/**
 * ValidatorDecision v0.1 + UWR contracts
 * - Defines validator-facing decision envelopes and UWR structural contracts.
 * - UWR is a protocol primitive; weights/math must come from governance-approved config in afi-config.
 * - Reputation, PoI, and PoInsight MUST NOT override UWR output or TSSD vault finality.
 * - Structural envelopes only; emissions/mint/replay wiring live in afi-token / afi-reactor / afi-infra.
 */

import type { NoveltyResult } from "./NoveltyTypes";

/**
 * Allowed validator decision kinds.
 */
export type ValidatorDecisionKind = "approve" | "reject" | "flag" | "abstain";

/**
 * Base validator decision envelope, captured for audit/replay.
 * This type is strictly structural; it does not implement UWR or emissions.
 */
export interface ValidatorDecisionBase {
  /** Unique signal identifier being decided on */
  signalId: string;
  /** Validator identifier (agent/droid/human) producing the decision */
  validatorId: string;
  /** Decision outcome */
  decision: ValidatorDecisionKind;
  /** UWR-derived confidence scalar in [0,1]; UWR logic lives elsewhere */
  uwrConfidence: number;
  /** Optional regime tag aligned with macro.regimeTag in usignal schema */
  regimeTag?: string;
  /** Optional novelty evaluation result (see NoveltySpec v0.1) */
  novelty?: NoveltyResult;
  /** Short machine-readable reason tags (e.g., ["low-novelty", "conflict-with-baseline"]) */
  reasonCodes?: string[];
  /** Free-text justification */
  notes?: string;
  /** ISO timestamp when decision was created (for audit/replay) */
  createdAt: string;
}

/**
 * Outcome envelope that downstream mint/replay logic can consume.
 * This file does not define emissions or mint logic—only the shape.
 */
export interface ValidatorOutcome {
  mintEligible: boolean;
  mintReason?: string;
  replaySessionId?: string;
  decision: ValidatorDecisionBase;
}
