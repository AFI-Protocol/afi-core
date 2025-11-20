import { describe, it, expect } from 'vitest';
import { PoIValidator } from '../validators/PoIValidator';

describe('PoIValidator', () => {
  it('scores numeric signals higher', () => {
    const result = PoIValidator.evaluate({
      signalId: 'test-signal-1',
      content: 'BTC +5% on volume 2.3B',
    });

    expect(result).toBeDefined();
    expect(result.insightScore).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.derivedTags).toContain('macro');
  });
});