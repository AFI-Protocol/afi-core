import { describe, expect, it } from "vitest";
import {
  type AnalystScoreTemplate,
  AnalystScoreTemplateSchema
} from "../AnalystScoreTemplate.js";

describe("AnalystScoreTemplate", () => {
  const validTemplate: AnalystScoreTemplate = {
    // Identity
    analystId: "test-analyst",
    strategyId: "test-strategy",
    strategyVersion: "1.0.0",

    // Market context
    marketType: "perp",
    assetClass: "crypto",
    instrumentType: "linear-perp",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    venue: "binance",

    // Time / horizon
    signalTimeframe: "1h",
    holdingHorizon: "swing",

    // Direction & risk
    direction: "long",
    riskBucket: "medium",
    conviction: 0.75,

    // UWR axes + score
    uwrAxes: {
      structure: 0.8,
      execution: 0.7,
      risk: 0.75,
      insight: 0.65,
    },
    uwrScore: 0.725,

    // Optional narrative
    axisNotes: {
      structure: "Strong HTF alignment",
      execution: "Good trigger pattern",
    },
    axisFlags: ["trend-following"],
    rationale: "High-quality trend pullback setup",
    tags: ["trend", "pullback"],
  };

  it("should accept a well-formed AnalystScoreTemplate", () => {
    const result = AnalystScoreTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it("should reject template with missing required fields", () => {
    const invalidTemplate = {
      analystId: "test-analyst",
      // Missing strategyId, marketType, etc.
    };

    const result = AnalystScoreTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject template with conviction out of range", () => {
    const invalidTemplate = {
      ...validTemplate,
      conviction: 1.5, // Out of [0, 1] range
    };

    const result = AnalystScoreTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject template with UWR axes out of range", () => {
    const invalidTemplate = {
      ...validTemplate,
      uwrAxes: {
        structure: 1.2, // Out of [0, 1] range
        execution: 0.7,
        risk: 0.75,
        insight: 0.65,
      },
    };

    const result = AnalystScoreTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should reject template with UWR score out of range", () => {
    const invalidTemplate = {
      ...validTemplate,
      uwrScore: -0.1, // Out of [0, 1] range
    };

    const result = AnalystScoreTemplateSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
  });

  it("should accept template with optional fields omitted", () => {
    const minimalTemplate: AnalystScoreTemplate = {
      analystId: "test-analyst",
      strategyId: "test-strategy",
      marketType: "spot",
      assetClass: "crypto",
      instrumentType: "spot",
      baseAsset: "ETH",
      signalTimeframe: "4h",
      direction: "short",
      riskBucket: "low",
      conviction: 0.5,
      uwrAxes: {
        structure: 0.6,
        execution: 0.5,
        risk: 0.7,
        insight: 0.4,
      },
      uwrScore: 0.55,
    };

    const result = AnalystScoreTemplateSchema.safeParse(minimalTemplate);
    expect(result.success).toBe(true);
  });

  it("should accept template with Greeks for options", () => {
    const optionsTemplate: AnalystScoreTemplate = {
      ...validTemplate,
      marketType: "options",
      instrumentType: "option",
      strike: 50000,
      optionType: "call",
      expiry: "2025-12-31",
      greeks: {
        delta: 0.6,
        gamma: 0.02,
        theta: -0.05,
        vega: 0.15,
        rho: 0.01,
      },
    };

    const result = AnalystScoreTemplateSchema.safeParse(optionsTemplate);
    expect(result.success).toBe(true);
  });
});

