import { z } from "zod";
export const SignalSchema = z.object({
    id: z.string().optional(),
    symbol: z.string(),
    market: z.string().optional(),
    action: z.enum(["buy", "sell", "hold"]),
    price: z.number().optional(),
    timestamp: z.union([z.number(), z.string()]).optional(),
    source: z.string().optional(),
    strategy: z.string().optional(),
    notes: z.string().optional(),
    targetPrice: z.number().optional(),
    stopLoss: z.number().optional(),
    timeframe: z.string().optional(),
    strength: z.enum(["low", "medium", "high"]).optional(),
    // ✨ This field is required by SignalScorer.ts
    content: z.string().min(1).max(280),
    indicators: z.array(z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
        timeframe: z.string().optional(),
    })).optional(),
    analysis: z.array(z.object({
        type: z.string(),
        result: z.string(),
        confidence: z.number().optional(),
    })).optional(),
    subscribed: z.boolean().optional(),
    score: z.number().optional(),
});
//# sourceMappingURL=universal_signal_schema.js.map