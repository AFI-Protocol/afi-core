/**
 * Type tests for afi-core/src/analyst/AnalystScoreTemplate.ts
 *
 * These tests verify that TypeScript interfaces are correctly defined
 * and that type guards work as expected.
 *
 * This file uses type assertions to verify type compatibility
 * without requiring a test framework.
 */

import type {
  AnalystScoreTemplate,
  AFIDAGConfig,
  AnalystScoreTemplateWithAFIDAG,
} from '../AnalystScoreTemplate';
import {
  isAFIDAGConfig,
  isAnalystScoreTemplateWithAFIDAG,
} from '../AnalystScoreTemplate';

// ============================================================================
// AFIDAGConfig Type Tests
// ============================================================================

const validAFIDAGConfig: AFIDAGConfig = {
  enrichmentNodes: ['price-enricher', 'sentiment-analyzer', 'onchain-tracker'],
  parallelProcessing: true,
  maxParallelNodes: 5,
  enrichmentTimeout: 30000,
};

const minimalAFIDAGConfig: AFIDAGConfig = {
  enrichmentNodes: ['price-enricher'],
  parallelProcessing: false,
};

// ============================================================================
// AnalystScoreTemplateWithAFIDAG Type Tests
// ============================================================================

const validAnalystScoreTemplateWithAFIDAG: AnalystScoreTemplateWithAFIDAG = {
  // Base AnalystScoreTemplate fields
  analystId: 'crypto-analyst',
  strategyId: 'trend-following-v1',
  strategyVersion: '1.0.0',
  marketType: 'spot',
  assetClass: 'crypto',
  instrumentType: 'spot',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  venue: 'binance',
  signalTimeframe: '4h',
  holdingHorizon: 'swing',
  direction: 'long',
  riskBucket: 'medium',
  conviction: 0.75,
  greeks: {
    delta: 0.5,
    gamma: 0.1,
    theta: -0.05,
    vega: 0.2,
    rho: 0.01,
  },
  uwrAxes: {
    structure: 0.8,
    execution: 0.7,
    risk: 0.75,
    insight: 0.8,
  },
  uwrScore: 0.7625,
  axisNotes: {
    structure: 'Strong trend structure',
    execution: 'Good entry point',
    risk: 'Acceptable risk level',
    insight: 'Clear market insight',
  },
  axisFlags: ['high-confidence', 'trend-following'],
  rationale: 'Strong uptrend with good risk/reward ratio',
  caveats: 'Monitor for trend reversal',
  tags: ['trend-following', 'BTC', '4h'],
  // AFI DAG-specific fields
  afiDAGConfig: validAFIDAGConfig,
  enrichmentResults: new Map([
    ['price-enricher', { price: 50000, volume: 1000 }],
    ['sentiment-analyzer', { sentiment: 'bullish', confidence: 0.8 }],
  ]),
};

const minimalAnalystScoreTemplateWithAFIDAG: AnalystScoreTemplateWithAFIDAG = {
  // Minimal base AnalystScoreTemplate fields
  analystId: 'equity-trader',
  strategyId: 'mean-reversion-v2',
  marketType: 'spot',
  assetClass: 'equity',
  instrumentType: 'spot',
  baseAsset: 'AAPL',
  venue: 'NYSE',
  signalTimeframe: '1d',
  direction: 'long',
  riskBucket: 'low',
  conviction: 0.6,
  uwrAxes: {
    structure: 0.7,
    execution: 0.6,
    risk: 0.65,
    insight: 0.7,
  },
  uwrScore: 0.6625,
  // AFI DAG-specific fields
  afiDAGConfig: minimalAFIDAGConfig,
};

const analystScoreTemplateWithoutAFIDAG: AnalystScoreTemplateWithAFIDAG = {
  // Base AnalystScoreTemplate fields only
  analystId: 'crypto-analyst',
  strategyId: 'trend-following-v1',
  marketType: 'spot',
  assetClass: 'crypto',
  instrumentType: 'spot',
  baseAsset: 'ETH',
  venue: 'coinbase',
  signalTimeframe: '1h',
  direction: 'short',
  riskBucket: 'high',
  conviction: 0.85,
  uwrAxes: {
    structure: 0.9,
    execution: 0.8,
    risk: 0.7,
    insight: 0.85,
  },
  uwrScore: 0.8125,
  // No AFI DAG-specific fields
};

// ============================================================================
// Type Guard Tests
// ============================================================================

// Test isAFIDAGConfig
const afdDAGConfigTest1 = {
  enrichmentNodes: ['price-enricher', 'sentiment-analyzer'],
  parallelProcessing: true,
};

if (isAFIDAGConfig(afdDAGConfigTest1)) {
  const enrichmentNodes: string[] = afdDAGConfigTest1.enrichmentNodes;
  const parallelProcessing: boolean = afdDAGConfigTest1.parallelProcessing;
  const maxParallelNodes: number | undefined = afdDAGConfigTest1.maxParallelNodes;
  const enrichmentTimeout: number | undefined = afdDAGConfigTest1.enrichmentTimeout;
}

// Test isAnalystScoreTemplateWithAFIDAG
const analystScoreTemplateTest1 = {
  analystId: 'crypto-analyst',
  strategyId: 'trend-following-v1',
  marketType: 'spot' as const,
  assetClass: 'crypto' as const,
  instrumentType: 'spot' as const,
  baseAsset: 'BTC',
  signalTimeframe: '4h',
  direction: 'long' as const,
  riskBucket: 'medium' as const,
  conviction: 0.75,
  uwrAxes: {
    structure: 0.8,
    execution: 0.7,
    risk: 0.75,
    insight: 0.8,
  },
  uwrScore: 0.7625,
  afiDAGConfig: validAFIDAGConfig,
  enrichmentResults: new Map(),
};

if (isAnalystScoreTemplateWithAFIDAG(analystScoreTemplateTest1)) {
  const analystId: string = analystScoreTemplateTest1.analystId;
  const strategyId: string = analystScoreTemplateTest1.strategyId;
  const uwrScore: number = analystScoreTemplateTest1.uwrScore;
  const afiDAGConfig: AFIDAGConfig | undefined = analystScoreTemplateTest1.afiDAGConfig;
  const enrichmentResults: Map<string, unknown> | undefined = analystScoreTemplateTest1.enrichmentResults;
}

// ============================================================================
// Type Compatibility Tests
// ============================================================================

// Test that AFIDAGConfig can be used in AnalystScoreTemplateWithAFIDAG
const templateWithConfig: AnalystScoreTemplateWithAFIDAG = {
  analystId: 'crypto-analyst',
  strategyId: 'trend-following-v1',
  marketType: 'spot',
  assetClass: 'crypto',
  instrumentType: 'spot',
  baseAsset: 'BTC',
  signalTimeframe: '4h',
  direction: 'long',
  riskBucket: 'medium',
  conviction: 0.75,
  uwrAxes: {
    structure: 0.8,
    execution: 0.7,
    risk: 0.75,
    insight: 0.8,
  },
  uwrScore: 0.7625,
  afiDAGConfig: validAFIDAGConfig,
};

// Test that AnalystScoreTemplate can be extended with AFI DAG fields
const baseTemplate: AnalystScoreTemplate = {
  analystId: 'crypto-analyst',
  strategyId: 'trend-following-v1',
  marketType: 'spot',
  assetClass: 'crypto',
  instrumentType: 'spot',
  baseAsset: 'BTC',
  signalTimeframe: '4h',
  direction: 'long',
  riskBucket: 'medium',
  conviction: 0.75,
  uwrAxes: {
    structure: 0.8,
    execution: 0.7,
    risk: 0.75,
    insight: 0.8,
  },
  uwrScore: 0.7625,
};

const extendedTemplate: AnalystScoreTemplateWithAFIDAG = {
  ...baseTemplate,
  afiDAGConfig: validAFIDAGConfig,
  enrichmentResults: new Map(),
};

// Test that config can be passed to functions expecting specific types
function processAFIDAGConfig(config: AFIDAGConfig): void {
  console.log(`Processing AFI DAG config with ${config.enrichmentNodes.length} nodes`);
}

function processAnalystScoreTemplate(template: AnalystScoreTemplate): void {
  console.log(`Processing analyst score: ${template.analystId} - ${template.uwrScore}`);
}

function processAnalystScoreTemplateWithAFIDAG(template: AnalystScoreTemplateWithAFIDAG): void {
  console.log(`Processing analyst score with AFI DAG: ${template.analystId}`);
  if (template.afiDAGConfig) {
    console.log(`  Parallel processing: ${template.afiDAGConfig.parallelProcessing}`);
  }
  if (template.enrichmentResults) {
    console.log(`  Enrichment results: ${template.enrichmentResults.size}`);
  }
}

processAFIDAGConfig(validAFIDAGConfig);
processAnalystScoreTemplate(baseTemplate);
processAnalystScoreTemplateWithAFIDAG(extendedTemplate);

// ============================================================================
// Export for type checking
// ============================================================================

export {
  validAFIDAGConfig,
  minimalAFIDAGConfig,
  validAnalystScoreTemplateWithAFIDAG,
  minimalAnalystScoreTemplateWithAFIDAG,
  analystScoreTemplateWithoutAFIDAG,
  templateWithConfig,
  baseTemplate,
  extendedTemplate,
};
