import { PoIValidator } from '../validators/PoIValidator';

describe('PoIValidator', () => {
  it('scores numeric signals higher', () => {
    const withNum = PoIValidator.evaluate({ id:'1', content:'BTC +5% on volume 2.3B'} as any);
    const noNum   = PoIValidator.evaluate({ id:'2', content:'Macro rumblings ahead'} as any);

    expect(withNum.insightScore).toBeGreaterThan(noNum.insightScore);
    expect(withNum.confidence).toBeGreaterThan(0.5);
  });
});
