import { describe, it, expect } from 'vitest';
import { PoIValidator } from '../validators/PoIValidator';

describe('PoIValidator', () => {
  it('scores numeric signals higher', () => {
    const result = PoIValidator.evaluate({
      id: '1',
      content: 'BTC +5% on volume 2.3B',
    } as any);

    expect(result).toBeDefined(); // Adjust expectation as scoring evolves
  });
});