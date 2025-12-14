/**
 * Tests for GreeksDecayTemplate
 */

import { describe, it, expect } from "vitest";
import {
  type GreeksDecayTemplate,
  type DecayParams,
  GreeksDecayTemplateSchema,
  DEFAULT_DECAY_TEMPLATES_BY_HORIZON,
  pickDecayParamsForAnalystScore,
  applyTimeDecay,
} from "../GreeksDecayTemplate.js";
import type { AnalystScoreTemplate } from "../../analyst/AnalystScoreTemplate.js";

describe("GreeksDecayTemplateSchema", () => {
  it("should validate a correct exponential decay template", () => {
    const validTemplate: GreeksDecayTemplate = {
      templateId: "test-decay-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 1440,
      maxLifeMinutes: 4320,
      decayModel: "exp",
      halfLifeMinutes: 720,
      thetaBias: 0.5,
      notes: ["Test template"],
    };

    const result = GreeksDecayTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it("should validate a cliff decay template without halfLifeMinutes", () => {
    const validTemplate: GreeksDecayTemplate = {
      templateId: "test-cliff-v1",
      horizonLabel: "scalp",
      targetHoldingMinutes: 10,
      maxLifeMinutes: 30,
      decayModel: "cliff",
    };

    const result = GreeksDecayTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it("should reject negative targetHoldingMinutes", () => {
    const invalidTemplate = {
      templateId: "test-invalid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: -100,
      decayModel: "exp",
      halfLifeMinutes: 50,
    };

    const result = GreeksDecayTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject zero targetHoldingMinutes", () => {
    const invalidTemplate = {
      templateId: "test-invalid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 0,
      decayModel: "exp",
      halfLifeMinutes: 50,
    };

    const result = GreeksDecayTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject exp decay model without halfLifeMinutes", () => {
    const invalidTemplate = {
      templateId: "test-invalid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 100,
      decayModel: "exp",
      // Missing halfLifeMinutes
    };

    const result = GreeksDecayTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject linear decay model without halfLifeMinutes", () => {
    const invalidTemplate = {
      templateId: "test-invalid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 100,
      decayModel: "linear",
      // Missing halfLifeMinutes
    };

    const result = GreeksDecayTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject thetaBias outside [0, 1] range", () => {
    const invalidTemplate = {
      templateId: "test-invalid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 100,
      decayModel: "exp",
      halfLifeMinutes: 50,
      thetaBias: 1.5, // Invalid: > 1
    };

    const result = GreeksDecayTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should accept thetaBias = null", () => {
    const validTemplate = {
      templateId: "test-valid-v1",
      horizonLabel: "swing",
      targetHoldingMinutes: 100,
      decayModel: "exp",
      halfLifeMinutes: 50,
      thetaBias: null,
    };

    const result = GreeksDecayTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });
});

describe("DEFAULT_DECAY_TEMPLATES_BY_HORIZON", () => {
  it("should have templates for all holding horizons", () => {
    const expectedHorizons = ["scalp", "intraday", "swing", "position"];

    for (const horizon of expectedHorizons) {
      expect(DEFAULT_DECAY_TEMPLATES_BY_HORIZON).toHaveProperty(horizon);
    }
  });

  it("should have valid templates that pass schema validation", () => {
    for (const [horizon, template] of Object.entries(DEFAULT_DECAY_TEMPLATES_BY_HORIZON)) {
      const result = GreeksDecayTemplateSchema.safeParse(template);
      expect(result.success).toBe(true);
    }
  });

  it("should have increasing targetHoldingMinutes from scalp to position", () => {
    const scalp = DEFAULT_DECAY_TEMPLATES_BY_HORIZON.scalp;
    const intraday = DEFAULT_DECAY_TEMPLATES_BY_HORIZON.intraday;
    const swing = DEFAULT_DECAY_TEMPLATES_BY_HORIZON.swing;
    const position = DEFAULT_DECAY_TEMPLATES_BY_HORIZON.position;

    expect(scalp.targetHoldingMinutes).toBeLessThan(intraday.targetHoldingMinutes);
    expect(intraday.targetHoldingMinutes).toBeLessThan(swing.targetHoldingMinutes);
    expect(swing.targetHoldingMinutes).toBeLessThan(position.targetHoldingMinutes);
  });
});

describe("pickDecayParamsForAnalystScore", () => {
  const createMockAnalystScore = (holdingHorizon?: string): AnalystScoreTemplate => ({
    analystId: "test-analyst",
    strategyId: "test-strategy",
    marketType: "spot",
    assetClass: "crypto",
    instrumentType: "spot",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    signalTimeframe: "1h",
    holdingHorizon: holdingHorizon as any,
    direction: "long",
    riskBucket: "medium",
    conviction: 0.8,
    uwrAxes: {
      structure: 0.75,
      execution: 0.75,
      risk: 0.75,
      insight: 0.75,
    },
    uwrScore: 0.75,
  });

  it("should pick scalp decay params for scalp horizon", () => {
    const analystScore = createMockAnalystScore("scalp");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-scalp-v1");
    expect(params.halfLifeMinutes).toBe(8);
  });

  it("should pick intraday decay params for intraday horizon", () => {
    const analystScore = createMockAnalystScore("intraday");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-intraday-v1");
    expect(params.halfLifeMinutes).toBe(60);
  });

  it("should pick swing decay params for swing horizon", () => {
    const analystScore = createMockAnalystScore("swing");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-swing-v1");
    expect(params.halfLifeMinutes).toBe(720);
  });

  it("should pick position decay params for position horizon", () => {
    const analystScore = createMockAnalystScore("position");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-position-v1");
    expect(params.halfLifeMinutes).toBe(5040);
  });

  it("should map long-term to position decay params", () => {
    const analystScore = createMockAnalystScore("long-term");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-position-v1");
    expect(params.halfLifeMinutes).toBe(5040);
  });

  it("should fall back to swing when holdingHorizon is missing", () => {
    const analystScore = createMockAnalystScore(undefined);
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-swing-v1");
    expect(params.halfLifeMinutes).toBe(720);
  });

  it("should fall back to swing when holdingHorizon is unrecognized", () => {
    const analystScore = createMockAnalystScore("unknown-horizon");
    const params = pickDecayParamsForAnalystScore(analystScore);

    expect(params.greeksTemplateId).toBe("decay-swing-v1");
    expect(params.halfLifeMinutes).toBe(720);
  });

  it("should return consistent halfLifeMinutes and greeksTemplateId", () => {
    const analystScore = createMockAnalystScore("swing");
    const params1 = pickDecayParamsForAnalystScore(analystScore);
    const params2 = pickDecayParamsForAnalystScore(analystScore);

    expect(params1).toEqual(params2);
  });
});

describe("applyTimeDecay", () => {
  it("should return same score when elapsed time is 0", () => {
    const baseScore = 0.8;
    const timestamp = "2025-01-01T00:00:00.000Z";
    const decayed = applyTimeDecay(baseScore, timestamp, timestamp, {
      halfLifeMinutes: 60,
    });

    expect(decayed).toBe(baseScore);
  });

  it("should halve score after one half-life", () => {
    const baseScore = 1.0;
    const scoredAt = "2025-01-01T00:00:00.000Z";
    const nowIso = "2025-01-01T01:00:00.000Z"; // 60 minutes later
    const decayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 60,
    });

    expect(decayed).toBeCloseTo(0.5, 10);
  });

  it("should quarter score after two half-lives", () => {
    const baseScore = 1.0;
    const scoredAt = "2025-01-01T00:00:00.000Z";
    const nowIso = "2025-01-01T02:00:00.000Z"; // 120 minutes later
    const decayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 60,
    });

    expect(decayed).toBeCloseTo(0.25, 10);
  });

  it("should handle negative elapsed time as 0", () => {
    const baseScore = 0.8;
    const scoredAt = "2025-01-01T02:00:00.000Z";
    const nowIso = "2025-01-01T01:00:00.000Z"; // 1 hour before
    const decayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 60,
    });

    // Should treat as 0 elapsed time
    expect(decayed).toBe(baseScore);
  });

  it("should throw error for invalid halfLifeMinutes (zero)", () => {
    expect(() => {
      applyTimeDecay(0.8, "2025-01-01T00:00:00.000Z", "2025-01-01T01:00:00.000Z", {
        halfLifeMinutes: 0,
      });
    }).toThrow("Invalid halfLifeMinutes");
  });

  it("should throw error for invalid halfLifeMinutes (negative)", () => {
    expect(() => {
      applyTimeDecay(0.8, "2025-01-01T00:00:00.000Z", "2025-01-01T01:00:00.000Z", {
        halfLifeMinutes: -10,
      });
    }).toThrow("Invalid halfLifeMinutes");
  });

  it("should clamp result to [0, 1] for scores in that range", () => {
    const baseScore = 0.9;
    const scoredAt = "2025-01-01T00:00:00.000Z";
    const nowIso = "2025-01-01T12:00:00.000Z"; // 12 hours = 720 minutes
    const decayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 60,
    });

    // After 12 half-lives, score should be very close to 0
    expect(decayed).toBeGreaterThanOrEqual(0);
    expect(decayed).toBeLessThanOrEqual(1);
    expect(decayed).toBeCloseTo(0, 3);
  });

  it("should work with different half-life values", () => {
    const baseScore = 1.0;
    const scoredAt = "2025-01-01T00:00:00.000Z";
    const nowIso = "2025-01-01T12:00:00.000Z"; // 720 minutes

    // Swing half-life (720 minutes)
    const swingDecayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 720,
    });
    expect(swingDecayed).toBeCloseTo(0.5, 10);

    // Scalp half-life (8 minutes)
    const scalpDecayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 8,
    });
    expect(scalpDecayed).toBeLessThan(0.001); // Nearly zero after 90 half-lives
  });

  it("should handle fractional minutes correctly", () => {
    const baseScore = 1.0;
    const scoredAt = "2025-01-01T00:00:00.000Z";
    const nowIso = "2025-01-01T00:30:00.000Z"; // 30 minutes = 0.5 half-lives
    const decayed = applyTimeDecay(baseScore, scoredAt, nowIso, {
      halfLifeMinutes: 60,
    });

    // 0.5 half-lives => sqrt(0.5) ≈ 0.707
    expect(decayed).toBeCloseTo(Math.sqrt(0.5), 10);
  });
});

