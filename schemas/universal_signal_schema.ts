import { z } from "zod";

/* ---------- ENUMS ---------- */
export const Action  = z.enum(["buy", "sell", "alert", "info"]);
export const Source  = z.enum(["tradingview", "bot", "manual"]);
export const Market  = z.enum(["crypto", "forex", "stocks", "commodities", "futures"]);

/* ---------- MAIN SCHEMA ---------- */
export const SignalSchema = z.object({
  id: z.string().optional(),
  timestamp: z.number().default(() => Date.now()),

  /* origin */
  source: Source.default("tradingview"),
  symbol: z.string(),
  market: Market.optional(),

  /* core */
  action: Action,
  strategy: z.string().optional(),   // Pine strategy name
  scriptId: z.string().optional(),   // unique script hash

  /* price block */
  price:        z.number().optional(),
  targetPrice:  z.number().optional(),
  stopLoss:     z.number().optional(),

  /* meta */
  timeframe: z.string().optional(),
  strength:  z.union([z.string(), z.number()]).optional(),

  /* indicators */
  indicators: z.array(
    z.object({
      name: z.string(),
      value: z.any(),
      timeframe: z.string().optional()
    })
  ).optional(),

  /* analysis */
  analysis: z.array(
    z.object({
      type: z.string(),
      result: z.string(),
      confidence: z.number().min(0).max(100).optional()
    })
  ).optional(),

  /* free-form */
  note:       z.string().optional(), // Pine alert_message
  subscribed: z.boolean().optional() // true / false only
});
