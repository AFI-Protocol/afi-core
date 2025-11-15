import { z } from "zod";

/* ---------- ENUMS ---------- */
export const SignalActionSchema = z.enum(["buy", "sell"]);
export const SignalStrengthSchema = z.enum(["low", "medium", "high", "very-high"]);
export const SignalTimeframeSchema = z.enum(["1m","5m","15m","30m","1h","4h","1d","1w"]);
export const SignalSourceSchema  = z.enum(["manual","bot","tradingview"]);
export const MarketSchema        = z.enum(["crypto","forex","stocks","commodities","futures"]);
export const IndicatorNameSchema = z.enum([
  "RSI","MACD","Moving Average","Bollinger Bands","OBV","ATR","Stochastic","Volume"
]);

/* ---------- COMPONENTS ---------- */
export const SignalIndicatorSchema = z.object({
  name: IndicatorNameSchema,
  value: z.union([z.number(), z.string()]),
  timeframe: SignalTimeframeSchema.optional(),
});

export const SignalAnalysisSchema = z.object({
  type: z.string(),
  result: z.union([z.string(), z.number()]),
  confidence: z.number().min(0).max(100).optional(),
});

export const PatternAnalysisSchema = z.object({
  pattern: z.string(),
  confidence: z.number().min(0).max(100),
  description: z.string().optional(),
});

export const FuturesContractDataSchema = z.object({
  contractSize: z.number().positive(),
  leverage: z.number().positive(),
  marginType: z.enum(["isolated","cross"]),
  expiryDate: z.string().datetime().optional(),
});

/* ---------- BASE ---------- */
export const BaseSignalSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  market: MarketSchema,
  action: SignalActionSchema,
  price: z.number().positive(),
  timestamp: z.number().int().positive(),
  source: SignalSourceSchema,
});

/* ---------- COMPLETE ---------- */
export const SignalSchema = BaseSignalSchema.extend({
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  timeframe: SignalTimeframeSchema,
  strength: SignalStrengthSchema,
  indicators: z.array(SignalIndicatorSchema),
  analysis: z.array(SignalAnalysisSchema),
  patternAnalysis: PatternAnalysisSchema.optional(),
  takeProfitLevels: z.array(z.number().positive()).optional(),
  riskRewardRatio: z.number().positive().optional(),
  futuresData: FuturesContractDataSchema.optional(),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  userId: z.string().optional(),
  subscribed: z.boolean(),
});

/* ---------- PIPELINE VARIANTS ---------- */
export const IndicatorDataSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.array(z.number()), z.record(z.string(), z.number())]),
  timeframe: z.string(),
  timestamp: z.number().int().positive(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const RawSignalSchema = BaseSignalSchema.extend({
  timeframe: SignalTimeframeSchema.optional(),
  pattern: z.string().optional(),
  status: z.literal("new"),
});

export const EnrichedSignalSchema = BaseSignalSchema.extend({
  timeframe: SignalTimeframeSchema,
  pattern: z.string().optional(),
  indicators: z.record(z.string(), IndicatorDataSchema),
  status: z.literal("enriched"),
});

export const AnalyzedSignalSchema = EnrichedSignalSchema.extend({
  analysis: z.object({
    patternConfidence: z.number().min(0).max(100).optional(),
    trendStrength: z.number().min(0).max(100).optional(),
    supportLevel: z.number().positive().optional(),
    resistanceLevel: z.number().positive().optional(),
    volumeAnalysis: z.string().optional(),
    riskLevel: z.enum(["low","medium","high"]).optional(),
    comments: z.string().optional(),
  }),
  status: z.literal("analyzed"),
});

export const ScoredSignalSchema = AnalyzedSignalSchema.extend({
  score: z.object({
    overall: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
    fundamental: z.number().min(0).max(100).optional(),
    sentiment: z.number().min(0).max(100).optional(),
    breakdown: z.record(z.string(), z.number()),
  }),
  status: z.literal("scored"),
});

/* ---------- CONFIG ---------- */
export const PipelineConfigSchema = z.object({
  enabled: z.boolean(),
  enrichment: z.object({
    providers: z.array(z.string()),
    indicators: z.array(z.string()),
    timeframes: z.array(z.string()),
  }),
  analysis: z.object({
    providers: z.array(z.string()),
    methods: z.array(z.string()),
  }),
  scoring: z.object({
    providers: z.array(z.string()),
    weights: z.record(z.string(), z.number()),
    threshold: z.number().min(0).max(100),
  }),
});

/* ---------- EXPORTS ---------- */
export {
  SignalSchema,
  BaseSignalSchema,
  RawSignalSchema,
  EnrichedSignalSchema,
  AnalyzedSignalSchema,
  ScoredSignalSchema,
  PipelineConfigSchema,
};
