/**
 * Signal Decay Integration Tests
 * 
 * Tests AFI-specific decay wrappers that integrate afi-math decay models
 * with UWR scoring and signal lifecycle.
 * 
 * Math Audit 2025-12-06
 */

import { describe, it, expect } from "vitest";
import {
  applyTimeDecayToUwrScore,
  calculateAdjustedHalfLife,
  applyVolatilityAdjustedDecay,
  remainingAfterHalfLives,
  DEFAULT_SIGNAL_HALF_LIFE_HOURS
} from "../SignalDecay.js";

describe("SignalDecay - Time-based UWR Decay", () => {
  describe("applyTimeDecayToUwrScore", () => {
    it("should not decay a fresh signal (age = 0)", () => {
      const uwrScore = 0.8;
      const decayed = applyTimeDecayToUwrScore(uwrScore, 0);
      
      expect(decayed).toBe(0.8);
    });

    it("should decay to 50% after one half-life", () => {
      const uwrScore = 1.0;
      const halfLife = 24; // 24 hours
      const decayed = applyTimeDecayToUwrScore(uwrScore, halfLife, halfLife);
      
      expect(decayed).toBeCloseTo(0.5, 6);
    });

    it("should decay to 25% after two half-lives", () => {
      const uwrScore = 1.0;
      const halfLife = 24;
      const decayed = applyTimeDecayToUwrScore(uwrScore, 2 * halfLife, halfLife);
      
      expect(decayed).toBeCloseTo(0.25, 6);
    });

    it("should decay a realistic UWR score over 12 hours", () => {
      const uwrScore = 0.75;
      const ageHours = 12;
      const halfLife = 24;
      
      const decayed = applyTimeDecayToUwrScore(uwrScore, ageHours, halfLife);
      
      // After 12 hours (0.5 half-lives), should be ~0.75 * 0.707 ≈ 0.53
      expect(decayed).toBeCloseTo(0.53, 2);
      expect(decayed).toBeLessThan(uwrScore);
      expect(decayed).toBeGreaterThan(uwrScore * 0.5);
    });

    it("should use default half-life of 24 hours", () => {
      const uwrScore = 0.8;
      const ageHours = 24;
      
      const decayed = applyTimeDecayToUwrScore(uwrScore, ageHours);
      
      // After 24 hours with default half-life, should be 0.8 * 0.5 = 0.4
      expect(decayed).toBeCloseTo(0.4, 6);
    });
  });

  describe("calculateAdjustedHalfLife", () => {
    it("should return base half-life with normal volatility and conviction", () => {
      const adjusted = calculateAdjustedHalfLife(24, 1.0, 1.0);
      expect(adjusted).toBe(24);
    });

    it("should shorten half-life with high volatility", () => {
      const adjusted = calculateAdjustedHalfLife(24, 2.0, 1.0);
      
      // High volatility (2x) should halve the half-life
      expect(adjusted).toBeCloseTo(12, 6);
    });

    it("should lengthen half-life with high conviction", () => {
      const adjusted = calculateAdjustedHalfLife(24, 1.0, 2.0);
      
      // High conviction (2x) should double the half-life
      expect(adjusted).toBeCloseTo(48, 6);
    });

    it("should combine volatility and conviction effects", () => {
      const adjusted = calculateAdjustedHalfLife(24, 2.0, 3.0);
      
      // Formula: (24 * 3.0) / 2.0 = 36
      expect(adjusted).toBeCloseTo(36, 6);
    });
  });

  describe("applyVolatilityAdjustedDecay", () => {
    it("should decay faster in high volatility markets", () => {
      const uwrScore = 0.8;
      const ageHours = 24;
      
      const normalDecay = applyVolatilityAdjustedDecay(uwrScore, ageHours, 1.0, 1.0);
      const highVolDecay = applyVolatilityAdjustedDecay(uwrScore, ageHours, 2.0, 1.0);
      
      // High volatility should cause more decay
      expect(highVolDecay).toBeLessThan(normalDecay);
    });

    it("should decay slower for high conviction signals", () => {
      const uwrScore = 0.8;
      const ageHours = 24;
      
      const normalDecay = applyVolatilityAdjustedDecay(uwrScore, ageHours, 1.0, 1.0);
      const highConvictionDecay = applyVolatilityAdjustedDecay(uwrScore, ageHours, 1.0, 2.0);
      
      // High conviction should cause less decay
      expect(highConvictionDecay).toBeGreaterThan(normalDecay);
    });

    it("should handle realistic market scenario", () => {
      const uwrScore = 0.75;
      const ageHours = 12;
      const volatility = 1.5; // 50% above normal
      const conviction = 1.2; // 20% above normal
      
      const decayed = applyVolatilityAdjustedDecay(
        uwrScore,
        ageHours,
        volatility,
        conviction
      );
      
      // Should be between 0 and original score
      expect(decayed).toBeGreaterThan(0);
      expect(decayed).toBeLessThan(uwrScore);
      
      // With moderate volatility and conviction, should retain significant value
      expect(decayed).toBeGreaterThan(uwrScore * 0.5);
    });
  });

  describe("remainingAfterHalfLives", () => {
    it("should return 50% after 1 half-life", () => {
      expect(remainingAfterHalfLives(1)).toBeCloseTo(0.5, 10);
    });

    it("should return 25% after 2 half-lives", () => {
      expect(remainingAfterHalfLives(2)).toBeCloseTo(0.25, 10);
    });

    it("should return 12.5% after 3 half-lives", () => {
      expect(remainingAfterHalfLives(3)).toBeCloseTo(0.125, 10);
    });

    it("should return ~1% after 7 half-lives", () => {
      expect(remainingAfterHalfLives(7)).toBeCloseTo(0.0078125, 10);
    });
  });
});

