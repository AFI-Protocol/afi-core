import { z } from "zod";

/**
 * Analyzed Signal Schema - Enriched signal + validation and PoI analysis
 */
export const AnalyzedSignalSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  content: z.string(),
  timestamp: z.union([z.number(), z.string()]),
  source: z.string(),
  action: z.enum(["buy", "sell", "hold"]),
  price: z.number().optional(),
  market: z.string(),
  
  // Analysis results
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  }),
  
  pointOfInterest: z.object({
    insightScore: z.number().min(0).max(100),
    confidence: z.number().min(0).max(1),
    derivedTags: z.array(z.string())
  }),
  
  metadata: z.object({
    stage: z.literal("analyzed"),
    analyzedAt: z.string(),
    validatorResults: z.record(z.any()).optional(),
    lifecycleStage: z.string().optional()
  })
});

