# AFI Math Component Index

**Purpose**: Quick reference for all math components in AFI Protocol  
**Updated**: 2025-12-06 (Math Audit)

---

## Universal Weighting Rule (UWR)

### Implementation
- **File**: `afi-core/validators/UniversalWeightingRule.ts`
- **Function**: `computeUwrScore(axes, config)`
- **Status**: ✅ Production Ready

### Types
```typescript
interface UwrAxesInput {
  structureAxis: number;  // [0, 1]
  executionAxis: number;  // [0, 1]
  riskAxis: number;       // [0, 1]
  insightAxis: number;    // [0, 1]
}

interface UniversalWeightingRuleConfig {
  structureWeight: number;
  executionWeight: number;
  riskWeight: number;
  insightWeight: number;
}
```

### Tests
- **File**: `afi-core/validators/__tests__/UniversalWeightingRule.test.ts`
- **Count**: 13 tests
- **Coverage**: Basic math, edge cases, realistic scenarios, determinism

### Call Sites
- `afi-core/analysts/froggy.trend_pullback_v1.ts::scoreFroggyTrendPullback()`
- Used by: Froggy analyst (afi-reactor scored-only pipeline)

---

## Time/Score Decay

### Implementation
- **Core Math**: `afi-math/src/decay/decayModels.ts`
- **AFI Integration**: `afi-core/validators/SignalDecay.ts`
- **Status**: ✅ Production Ready (dormant in the scored-only reactor pipeline)

### Functions
```typescript
// Core decay math (afi-math)
exponentialDecay({ initialValue, halfLife, elapsed })
powerDecay({ initialValue, timeScale, power, elapsed })
timeWeightedScore({ baseScore, halfLife, age })
adjustedHalfLife({ baseHalfLife, volatility, conviction })

// AFI integration (afi-core)
applyTimeDecayToUwrScore(uwrScore, ageHours, halfLifeHours)
calculateAdjustedHalfLife(baseHalfLifeHours, volatility, conviction)
applyVolatilityAdjustedDecay(uwrScore, ageHours, volatility, conviction)
```

### Tests
- **afi-math**: `afi-math/tests/decay.test.ts` (core math)
- **afi-core**: `afi-core/validators/__tests__/SignalDecay.test.ts` (integration)
- **Count**: 16 integration tests
- **Coverage**: Time decay, volatility adjustment, half-life calculations

### Call Sites
- **Current**: None (ready but not wired into the scored-only reactor pipeline)
- **Future**: `afi-core/analysts/froggy.trend_pullback_v1.ts` (when timestamps added)

---

## Novelty/Rarity

### Implementation
- **File**: `afi-core/validators/NoveltyScorer.ts`
- **Function**: `computeNoveltyScore(signal, cohortBaseline)`
- **Status**: ✅ Basic Implementation (v0.1)

### Types
```typescript
interface NoveltySignalInput {
  signalId: string;
  cohortId: string;
  market?: string;
  timeframe?: string;
  strategy?: string;
  direction?: "long" | "short" | "neutral";
  structureAxis?: number;
  executionAxis?: number;
  riskAxis?: number;
  insightAxis?: number;
  createdAt?: string;
}

interface NoveltyResult {
  noveltyScore: number;        // [0, 1]
  noveltyClass: NoveltyClass;  // "breakthrough" | "incremental" | "redundant" | "contradictory"
  cohortId: string;
  baselineId?: string;
  referenceSignals?: NoveltyReferenceSignal[];
  evidenceNotes?: string;
  flags?: string[];
  computedAt: string;
}
```

### Tests
- **File**: `afi-core/validators/__tests__/NoveltyScorer.test.ts`
- **Count**: 9 tests
- **Coverage**: Empty cohort, duplicates, similarity, determinism

### Call Sites
- **Current**: None (ready but not wired)
- **Future**: Validator layer (after UWR scoring, before emissions)

---

## Emissions & Epoch Pulse

### On-Chain (Complete ✅)
- **Token Contract**: `afi-token/src/AFIToken.sol`
  - `mintEmissions(beneficiary, amount)` — Enforces 86B supply cap
- **Coordinator**: `afi-token/src/AFIMintCoordinator.sol`
  - `mintForSignal(req)` — Orchestrates token + receipt minting

### Off-Chain (Stubbed ⚠️)
- **Pseudocode**: `afi-token/logic/emissions_with_novelty.ts`
- **Models**: `afi-token/models/emissions_logic.ts`
- **Documentation**: `afi-skills/skills/scoring/epoch-pulse-emissions.md`

### Missing Components
- [ ] EmissionsCoordinator (off-chain policy engine)
- [ ] UWR → Emissions conversion
- [ ] Novelty → Emissions bonus
- [ ] Decay → Emissions penalty
- [ ] Reward splits (60/30/10)
- [ ] Epoch Pulse rhythm

### Tests
- **On-chain**: Solidity tests (not in scope)
- **Off-chain**: None (not implemented)

---

## Integration Map

```
Signal Flow (afi-reactor, scored-only):
┌─────────────────────────────────────────────────────────────┐
│ 1. Signal Ingest                                             │
│    └─> TradingView webhook → canonical USS v1.1 (rawUss)     │
├─────────────────────────────────────────────────────────────┤
│ 2. USS Telemetry Deriver                                     │
│    └─> Derive routing/debug fields into context.telemetry    │
├─────────────────────────────────────────────────────────────┤
│ 3. Enrichment (parallel branches → adapter merge)            │
│    ├─> Tech + Pattern (OHLCV indicators, chart patterns)     │
│    ├─> Sentiment + News (external APIs)                       │
│    └─> Enrichment Adapter merges legos + optional AI/ML       │
├─────────────────────────────────────────────────────────────┤
│ 4. Froggy Analyst (trend_pullback_v1)                        │
│    ├─> Build UWR axes from enriched signal                   │
│    ├─> ✅ computeUwrScore(axes) → uwrScore                   │
│    ├─> ⚠️ (Future) computeNoveltyScore() → noveltyResult    │
│    ├─> ⚠️ (Future) applyTimeDecay() → decayedScore          │
│    └─> Return ReactorScoredSignalV1 (analystScore + axes)    │
├─────────────────────────────────────────────────────────────┤
│ 5. TSSD Vault Write                                          │
│    └─> Persist scored signal (Reactor-owned collection)      │
└─────────────────────────────────────────────────────────────┘

Note: Validator certification and execution are NOT reactor stages.
The reactor emits a scored-only ReactorScoredSignalV1; downstream
certification (external) and mint orchestration (afi-mint) consume it.

Future Emissions Flow (downstream of the reactor, in afi-mint):
┌─────────────────────────────────────────────────────────────┐
│ After external certification of a scored signal:             │
│ ├─> EmissionsCoordinator.calculateEmissions()               │
│ │   ├─> Input: uwrScore, noveltyResult, decayedScore        │
│ │   ├─> Apply proportional allocation                        │
│ │   ├─> Apply novelty bonus                                  │
│ │   ├─> Apply decay penalty                                  │
│ │   └─> Split rewards (60/30/10)                             │
│ └─> AFIMintCoordinator.mintForSignal()                       │
│     └─> AFIToken.mintEmissions() (on-chain)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Import Paths

```typescript
// UWR
import { computeUwrScore, defaultUwrConfig } from "afi-core/validators/UniversalWeightingRule.js";

// Decay
import { applyTimeDecayToUwrScore } from "afi-core/validators/SignalDecay.js";
import { decay } from "@afi-protocol/afi-math";

// Novelty
import { computeNoveltyScore } from "afi-core/validators/NoveltyScorer.js";
import type { NoveltyResult } from "afi-core/validators/NoveltyTypes.js";
```

### Default Constants

```typescript
// UWR
defaultUwrConfig = {
  structureWeight: 0.25,
  executionWeight: 0.25,
  riskWeight: 0.25,
  insightWeight: 0.25
}

// Decay
DEFAULT_SIGNAL_HALF_LIFE_HOURS = 24  // 1 day

// Novelty
// (No defaults, cohort-relative)
```

---

## Documentation

- **Full Audit Report**: `afi-core/docs/AFI_MATH_AUDIT_REPORT.md`
- **Quick Summary**: `afi-core/docs/MATH_AUDIT_SUMMARY.md`
- **This Index**: `afi-core/docs/MATH_INDEX.md`

---

**Last Updated**: 2025-12-06 (Math Audit Complete)


