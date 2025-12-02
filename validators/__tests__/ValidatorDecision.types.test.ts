import { describe, it, expect } from "vitest";
import {
  ValidatorDecisionBase,
  ValidatorOutcome,
  ValidatorDecisionKind,
} from "../ValidatorDecision";
import { NoveltyResult } from "../NoveltyTypes";

describe("ValidatorDecision types", () => {
  it("constructs a valid ValidatorDecisionBase shape", () => {
    const novelty: NoveltyResult = {
      noveltyScore: 0.82,
      noveltyClass: "incremental",
      cohortId: "btc-perp-4h-v1",
      referenceSignals: [{ signalId: "ref-1", label: "prior insight" }],
      computedAt: new Date().toISOString(),
    };

    const decision: ValidatorDecisionBase = {
      signalId: "signal-123",
      validatorId: "validator-xyz",
      decision: "approve" satisfies ValidatorDecisionKind,
      uwrConfidence: 0.91,
      regimeTag: "expansion",
      novelty,
      reasonCodes: ["high-quality", "novelty-ok"],
      notes: "Solid insight with acceptable novelty.",
      createdAt: new Date().toISOString(),
    };

    expect(decision.decision).toBe("approve");
    expect(decision.novelty?.noveltyScore).toBeCloseTo(0.82, 2);
    expect(decision.uwrConfidence).toBeGreaterThan(0.5);
  });

  it("constructs a ValidatorOutcome wrapper", () => {
    const decision: ValidatorDecisionBase = {
      signalId: "signal-456",
      validatorId: "validator-abc",
      decision: "flag",
      uwrConfidence: 0.4,
      createdAt: new Date().toISOString(),
    };

    const outcome: ValidatorOutcome = {
      mintEligible: false,
      mintReason: "needs-review",
      replaySessionId: "replay-001",
      decision,
    };

    expect(outcome.mintEligible).toBe(false);
    expect(outcome.decision.decision).toBe("flag");
    expect(outcome.replaySessionId).toBe("replay-001");
  });
});
