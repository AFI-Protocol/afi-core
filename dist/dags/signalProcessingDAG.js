/**
 * AFI Protocol Signal Processing DAG
 * Deterministic pipeline: Raw → Enriched → Analyzed → Scored → Vault
 */

import { RawSignalSchema } from '../schemas/raw_signal_schema.js';
import { EnrichedSignalSchema } from '../schemas/enriched_signal_schema.js';
import { AnalyzedSignalSchema } from '../schemas/analyzed_signal_schema.js';
import { ScoredSignalSchema } from '../schemas/scored_signal_schema.js';
import { runPoIValidator } from '../validators/poiValidator.js';
import { runPoInsightValidator } from '../validators/poinsightValidator.js';

/**
 * Create a minimal mock signal for testing
 */
function createMockSignal() {
  return {
    id: `signal_${Date.now()}`,
    symbol: 'TEST',
    content: 'Mock signal for DAG test',
    market: 'demo',
    action: 'buy',
    timestamp: new Date().toISOString(),
    source: 'dag-test'
  };
}

/**
 * DAG Node: Raw Signal Processing
 * Validates and normalizes incoming signals
 */
export async function processRawSignal(rawInput) {
  console.log('[DAG] Processing raw signal...');
  
  // Handle missing input by creating mock signal
  const input = rawInput || createMockSignal();
  
  // TODO: Implement raw signal validation and normalization
  const validated = RawSignalSchema.parse({
    ...input,
    id: input.id || `signal_${Date.now()}`,
    timestamp: input.timestamp || new Date().toISOString(),
    metadata: {
      stage: "raw",
      receivedAt: new Date().toISOString(),
      sourceType: input.source ? "api" : "mock"
    }
  });
  
  console.log(`[DAG] → Raw signal processed: ${validated.id}`);
  return validated;
}

/**
 * DAG Node: Signal Enrichment
 * Adds market context and technical indicators
 */
export async function enrichSignal(rawSignal) {
  console.log('[DAG] Enriching signal with market context...');
  
  // TODO: Implement market data enrichment, indicator calculation
  const enriched = {
    ...rawSignal,
    market: rawSignal.market || "unknown",
    timeframe: rawSignal.timeframe || "1h",
    indicators: [], // TODO: Add technical indicators
    metadata: {
      stage: "enriched",
      enrichedAt: new Date().toISOString(),
      marketContext: {
        sector: "technology", // TODO: Derive from symbol
        volatility: 0.15,     // TODO: Calculate from market data
        volume: 1000000       // TODO: Fetch real volume
      }
    }
  };
  
  const validated = EnrichedSignalSchema.parse(enriched);
  console.log(`[DAG] → Signal enriched: ${validated.id}`);
  return validated;
}

/**
 * DAG Node: Signal Analysis
 * Validates signal and performs PoI analysis
 */
export async function analyzeSignal(enrichedSignal) {
  console.log('[DAG] Analyzing signal for validation and PoI...');
  
  // TODO: Integrate SignalValidator and PoIValidator
  const analyzed = {
    ...enrichedSignal,
    validation: {
      isValid: true,
      errors: [],
      warnings: []
    },
    pointOfInterest: {
      insightScore: 75, // TODO: Calculate from PoIValidator
      confidence: 0.8,  // TODO: Calculate confidence
      derivedTags: ["macro"] // TODO: Derive tags
    },
    metadata: {
      stage: "analyzed",
      analyzedAt: new Date().toISOString(),
      validatorResults: {},
      lifecycleStage: "new"
    }
  };
  
  const validated = AnalyzedSignalSchema.parse(analyzed);
  console.log(`[DAG] → Signal analyzed: ${validated.id}`);
  return validated;
}

/**
 * DAG Node: Signal Scoring
 * Final composite scoring and lifecycle management with validator integration
 */
export async function scoreSignal(analyzedSignal) {
  console.log('[DAG] Computing final signal score with validator integration...');
  
  try {
    // Run PoI Validator
    console.log('[DAG] → Invoking PoI Validator...');
    const poiResult = await runPoIValidator(analyzedSignal);
    
    // Run PoInsight Validator
    console.log('[DAG] → Invoking PoInsight Validator...');
    const poinsightResult = await runPoInsightValidator(analyzedSignal);
    
    // Aggregate validator results
    const aggregatedScore = Math.round((poiResult.score * 0.6) + (poinsightResult.insight * 0.4));
    const aggregatedConfidence = Math.round(((poiResult.metadata.confidence + poinsightResult.confidence) / 2) * 100);
    
    console.log(`[DAG] → Aggregated Score: ${aggregatedScore} (PoI: ${poiResult.score}, PoInsight: ${poinsightResult.insight})`);
    
    const scored = {
      ...analyzedSignal,
      score: aggregatedScore,
      finalComposite: aggregatedScore,
      breakdown: {
        poi: poiResult.score,
        insight: poinsightResult.insight,
        confidence: aggregatedConfidence
      },
      lifecycleStage: "new", // TODO: Determine from LifecycleManager
      vaultEligible: aggregatedScore >= 70, // TODO: Refine vault eligibility logic
      metadata: {
        stage: "scored",
        scoredAt: new Date().toISOString(),
        signalId: analyzedSignal.id,
        finalComposite: aggregatedScore,
        validatorResults: {
          poi: poiResult.metadata,
          poinsight: poinsightResult.metadata
        }
      }
    };
    
    const validated = ScoredSignalSchema.parse(scored);
    console.log(`[DAG] → Signal scored: ${validated.id} (Score: ${validated.score})`);
    return validated;
    
  } catch (error) {
    console.error('[DAG] Error in scoring stage:', error);
    throw error;
  }
}

/**
 * DAG Node: Vault Processing
 * Handles mature signal vaulting
 */
export async function processVault(scoredSignal) {
  console.log('[DAG] Processing vault eligibility...');
  
  // TODO: Integrate VaultService logic
  if (scoredSignal.vaultEligible) {
    console.log(`[DAG] Signal ${scoredSignal.id} eligible for vault (Score: ${scoredSignal.score})`);
    // TODO: Call VaultService.vaultSignal()
  } else {
    console.log(`[DAG] Signal ${scoredSignal.id} not eligible for vault (Score: ${scoredSignal.score})`);
  }
  
  console.log(`[DAG] → Vault processing completed: ${scoredSignal.id}`);
  return scoredSignal;
}

/**
 * Main DAG Execution Pipeline
 * Orchestrates the full Raw → Enriched → Analyzed → Scored → Vault flow
 */
export async function signalProcessingDAG(rawInput = null) {
  console.log('[DAG] Starting signal processing pipeline...');
  
  // Log input status
  if (!rawInput) {
    console.log('[DAG] No input provided, using mock signal for testing');
  }
  
  try {
    // Stage 1: Raw Processing
    const rawSignal = await processRawSignal(rawInput);
    
    // Stage 2: Enrichment
    const enrichedSignal = await enrichSignal(rawSignal);
    
    // Stage 3: Analysis
    const analyzedSignal = await analyzeSignal(enrichedSignal);
    
    // Stage 4: Scoring (now with validator integration)
    const scoredSignal = await scoreSignal(analyzedSignal);
    
    // Stage 5: Vault Processing
    const finalSignal = await processVault(scoredSignal);
    
    console.log(`[DAG] Pipeline completed for signal: ${finalSignal.id}`);
    console.log(`[DAG] Final score: ${finalSignal.score}, Vault eligible: ${finalSignal.vaultEligible}`);
    return finalSignal;
    
  } catch (error) {
    console.error('[DAG] Pipeline error:', error);
    throw error;
  }
}
