import { describe, it, expect } from 'vitest';
import { SignalSchema } from '../schemas/universal_signal_schema.mjs';

describe('SignalSchema', () => {
  it('validates a fully populated signal', () => {
    const validSignal = {
      id: 'test-signal-1',
      symbol: 'BTCUSDT',      // ✅ required
      market: 'crypto',
      action: 'buy',          // ✅ required
      price: 68000,
      timestamp: Date.now(),
      source: 'TradingView',
      strategy: 'Momentum',
      notes: 'Breaking resistance with high volume',
      targetPrice: 70000,
      stopLoss: 65000,
      timeframe: '1h',
      strength: 'high',
      indicators: [
        { name: 'RSI', value: 65 },
        { name: 'Volume', value: 'strong' },
      ],
      analysis: [
        { type: 'trend', result: 'uptrend', confidence: 0.9 },
      ],
      subscribed: true,
      score: 95,
    };

    const parsed = SignalSchema.safeParse(validSignal);
    expect(parsed.success).toBe(true);
  });

  it('fails validation when required fields are missing', () => {
    const invalidSignal = {
      market: 'crypto',
      price: 68000,
    };

    const parsed = SignalSchema.safeParse(invalidSignal);
    expect(parsed.success).toBe(false);
  });
});