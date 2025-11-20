import { z } from "zod";

/**
 * Enriched Signal Schema - Raw signal + market context and indicators
 */
export const EnrichedSignalSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  content: z.string(),
  timestamp: z.union([z.number(), z.string()]),
  source: z.string(),
  action: z.enum(["buy", "sell", "hold"]),
  price: z.number().optional(),
  
  // Enrichment data
  market: z.string(),
  timeframe: z.string().optional(),
  indicators: z.array(z.object({
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    timeframe: z.string().optional(),
  })).optional(),
  
  metadata: z.object({
    stage: z.literal("enriched"),
    enrichedAt: z.string(),
    marketContext: z.object({
      sector: z.string().optional(),
      volatility: z.number().optional(),
      volume: z.number().optional()
    }).optional()
  })
});

