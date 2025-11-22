import { describe, it, expect } from 'vitest';
import { SignalScorer } from '../validators/SignalScorer';

describe('SignalScorer', () => {
  it('scores numeric signals higher', () => {
    const result = SignalScorer.evaluate({
      symbol: 'BTCUSDT',
      action: 'buy' as const,
      content: 'BTC +5% on volume 2.3B',
      source: 'test',
      timestamp: new Date().toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.insightScore).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.derivedTags).toContain('macro');
  });
});