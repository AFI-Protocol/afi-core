import { z } from "zod";

/**
 * Scored Signal Schema - Final scored signal ready for vault consideration
 */
export const ScoredSignalSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  content: z.string(),
  timestamp: z.union([z.number(), z.string()]),
  source: z.string(),
  action: z.enum(["buy", "sell", "hold"]),
  price: z.number().optional(),
  market: z.string(),
  
  // Final scoring
  score: z.number().min(0).max(100),
  finalComposite: z.number().min(0).max(100),
  breakdown: z.object({
    poi: z.number(),
    insight: z.number(),
    confidence: z.number()
  }),
  
  // Lifecycle management
  lifecycleStage: z.enum(["new", "live", "active", "decaying", "mature"]),
  vaultEligible: z.boolean(),
  
  metadata: z.object({
    stage: z.literal("scored"),
    scoredAt: z.string(),
    signalId: z.string(),
    ageInMs: z.number().optional(),
    stageTransitions: z.array(z.string()).optional(),
    finalComposite: z.number()
  })
});

