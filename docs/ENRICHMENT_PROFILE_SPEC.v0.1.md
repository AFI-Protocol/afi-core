# EnrichmentProfile Specification v0.1

## Overview

**EnrichmentProfile** is a first-class configuration type that specifies which enrichment categories should be applied to a signal and how they should be parameterized. It serves as the "enrichment design" that personas like **Pixel Rick** (and similar engineering/configuration agents) will construct and attach to signals entering Froggy-style pipelines.

This specification is **v0.1** and is designed to be non-breaking. Future versions can add fields but MUST preserve backwards compatibility where possible.

---

## Purpose

EnrichmentProfile enables:

1. **Selective enrichment**: Only run enrichment categories that are relevant to a specific trading strategy
2. **Persona-driven design**: Personas like Pixel Rick can design enrichment strategies tailored to specific market conditions or signal types
3. **Resource optimization**: Avoid running expensive enrichment operations (e.g., sentiment analysis, news scraping) when they're not needed
4. **Testability**: Easily test pipelines with different enrichment configurations

---

## TypeScript Definition

```typescript
export interface EnrichmentProfile {
  technical?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  pattern?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  sentiment?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  news?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
  aiMl?: {
    enabled: boolean;
    preset?: string;
    params?: Record<string, unknown>;
  };
}
```

---

## Enrichment Categories

### 1. **technical**
Technical analysis indicators (EMA, RSI, volume, etc.)

**Common presets**:
- `"default"`: Standard TA suite (EMA 20/50, RSI, volume)
- `"full_suite"`: Extended TA (includes MACD, Bollinger Bands, ATR, etc.)
- `"trend_pullback"`: Optimized for trend-pullback strategies (EMA distance, sweet spot detection)
- `"minimal"`: Only essential indicators (EMA 20, volume)

### 2. **pattern**
Chart pattern detection (engulfing, hammer, liquidity sweeps, etc.)

**Common presets**:
- `"default"`: Standard candlestick patterns
- `"reversal_patterns"`: Focus on reversal patterns (engulfing, hammer, morning star)
- `"continuation_patterns"`: Focus on continuation patterns (flags, pennants)
- `"liquidity_sweeps"`: Detect stop hunts and liquidity grabs

### 3. **sentiment**
Market sentiment analysis (social media, on-chain metrics, etc.)

**Common presets**:
- `"default"`: Balanced sentiment analysis
- `"social_heavy"`: Emphasize social media sentiment
- `"onchain_heavy"`: Emphasize on-chain metrics
- `"minimal"`: Basic sentiment score only

### 4. **news**
News and event analysis (headlines, shock events, etc.)

**Common presets**:
- `"default"`: Standard news analysis
- `"shock_events_only"`: Only detect major shock events
- `"crypto_native"`: Focus on crypto-specific news sources
- `"macro"`: Focus on macro economic news

### 5. **aiMl**
AI/ML ensemble predictions

**Common presets**:
- `"default"`: Standard ensemble
- `"ensemble_v1"`: First-generation ensemble model
- `"ensemble_v2"`: Second-generation ensemble model (if available)
- `"minimal"`: Single model prediction only

---

## Example Profiles

### Example 1: Trend Pullback (All Categories Enabled)

```json
{
  "technical": {
    "enabled": true,
    "preset": "trend_pullback"
  },
  "pattern": {
    "enabled": true,
    "preset": "reversal_patterns"
  },
  "sentiment": {
    "enabled": true,
    "preset": "default"
  },
  "news": {
    "enabled": true,
    "preset": "shock_events_only"
  },
  "aiMl": {
    "enabled": true,
    "preset": "ensemble_v1"
  }
}
```

**Use case**: Comprehensive analysis for high-conviction trend-pullback setups. Pixel Rick would design this profile for signals where all available data is valuable.

---

### Example 2: TA-Only (No Sentiment or News)

```json
{
  "technical": {
    "enabled": true,
    "preset": "full_suite"
  },
  "pattern": {
    "enabled": true,
    "preset": "default"
  },
  "sentiment": {
    "enabled": false
  },
  "news": {
    "enabled": false
  },
  "aiMl": {
    "enabled": false
  }
}
```

**Use case**: Pure technical analysis for strategies that ignore sentiment and news. Pixel Rick would design this profile for scalping or intraday strategies where fundamentals are less relevant.

---

### Example 3: Sentiment-Heavy (Minimal TA)

```json
{
  "technical": {
    "enabled": true,
    "preset": "minimal"
  },
  "pattern": {
    "enabled": false
  },
  "sentiment": {
    "enabled": true,
    "preset": "social_heavy"
  },
  "news": {
    "enabled": true,
    "preset": "crypto_native"
  },
  "aiMl": {
    "enabled": true,
    "preset": "ensemble_v2"
  }
}
```

**Use case**: Sentiment-driven strategies for meme coins or highly social assets. Pixel Rick would design this profile for signals where social momentum is the primary driver.

---

## Usage in afi-reactor Pipelines

### How Personas Attach Profiles

Personas like **Pixel Rick** construct EnrichmentProfile objects and attach them to signals at ingestion time:

```typescript
// Pixel Rick designs a profile for a specific strategy
const profile: EnrichmentProfile = {
  technical: { enabled: true, preset: "trend_pullback" },
  pattern: { enabled: true, preset: "reversal_patterns" },
  sentiment: { enabled: false },
  news: { enabled: false },
  aiMl: { enabled: true, preset: "ensemble_v1" }
};

// Attach to signal draft
const signalDraft = {
  symbol: "BTC/USDT",
  timeframe: "1h",
  strategy: "froggy_trend_pullback_v1",
  enrichmentProfile: profile  // <-- Pixel Rick's design
};
```

### How afi-reactor Honors Profiles

The `froggy-enrichment-adapter` plugin reads the profile from `signal.meta.enrichmentProfile` and:

1. Only populates enrichment sections where `enabled !== false`
2. Uses the specified `preset` to configure enrichment behavior
3. Falls back to a default profile (all categories enabled) if no profile is provided

---

## Contract for Personas

**Personas like Pixel Rick** are responsible for:

1. **Analyzing the signal strategy** and determining which enrichment categories are relevant
2. **Constructing an appropriate EnrichmentProfile** with enabled/disabled categories and presets
3. **Attaching the profile to the signal** at ingestion time (via `enrichmentProfile` field)

**afi-reactor** is responsible for:

1. **Preserving the profile** through the pipeline (Alpha Scout → Pixel Rick → Froggy Enrichment)
2. **Honoring the profile** in enrichment nodes (only run enabled categories)
3. **Tracking enrichment metadata** (which categories were actually enriched)

---

## Backwards Compatibility

- **Missing categories** default to enabled (for backwards compatibility with signals that don't specify a profile)
- **Missing profile** defaults to all categories enabled with "default" preset
- **Future versions** can add new categories or fields, but MUST NOT break existing profiles

---

## Future Enhancements (Not in v0.1)

- **Preset validation**: Validate that specified presets exist and are supported
- **Params schema**: Define schemas for category-specific params
- **Profile templates**: Pre-defined profiles for common strategies (stored in afi-config repo)
- **Profile versioning**: Track which version of EnrichmentProfile was used for a signal
- **Dynamic profiles**: Personas can adjust profiles based on market conditions

---

## Related Documentation

- `afi-core/analysts/froggy.enrichment_adapter.ts` - EnrichmentProfile type definition
- `afi-reactor/plugins/froggy-enrichment-adapter.plugin.ts` - Profile implementation
- `afi-reactor/test/froggyPipeline.test.ts` - Profile behavior tests

---

**Version**: 0.1  
**Status**: Active  
**Maintained by**: AFI Protocol Core Team  
**Last updated**: 2025-12-06

