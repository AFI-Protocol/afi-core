import { SignalSchema } from '../schemas/universal_signal_schema.mjs';

const exampleSignal = {
  id: "abc123",
  symbol: "BTCUSDT",
  market: "crypto",
  action: "buy",
  price: 30300.55,
  timestamp: Date.now(),
  source: "bot",
  strategy: "Scalping RSI Divergence",
  notes: "Alert triggered after RSI crosses 30 on 1h",
  targetPrice: 32500.00,
  stopLoss: 29500.00,
  timeframe: "1h",
  strength: "high",
  indicators: [
    { name: "RSI", value: 70, timeframe: "1h" },
    { name: "MACD", value: "bullish", timeframe: "1h" }
  ],
  analysis: [
    { type: "trend", result: "up", confidence: 90 }
  ],
  score: 88,
  subscribed: true
};

const result = SignalSchema.safeParse(exampleSignal);
if (result.success) {
  console.log("✅ Signal validated successfully.");
} else {
  console.error("❌ Validation failed:", result.error.format());
  process.exit(1);
}
