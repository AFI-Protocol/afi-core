import { z } from "zod";

/**
 * Raw Signal Schema - Initial signal input before any processing
 */
export const RawSignalSchema = z.object({
  id: z.string().optional(),
  symbol: z.string(),
  content: z.string().min(1).max(280),
  timestamp: z.union([z.number(), z.string()]).optional(),
  source: z.string().optional(),
  action: z.enum(["buy", "sell", "hold"]).optional(),
  price: z.number().optional(),
  // Raw signals have minimal validation
  metadata: z.object({
    stage: z.literal("raw"),
    receivedAt: z.string().optional(),
    sourceType: z.enum(["manual", "api", "webhook"]).optional()
  }).optional()
});

