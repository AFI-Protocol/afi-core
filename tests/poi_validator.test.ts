import { SignalScorer } from '../validators/SignalScorer';

describe('SignalScorer', () => {
  it('scores numeric signals higher', () => {
    const withNum = SignalScorer.evaluate({ id:'1', content:'BTC +5% on volume 2.3B'} as any);
    const noNum   = SignalScorer.evaluate({ id:'2', content:'Macro rumblings ahead'} as any);

    expect(withNum.insightScore).toBeGreaterThan(noNum.insightScore);
    expect(withNum.confidence).toBeGreaterThan(0.5);
  });
});
