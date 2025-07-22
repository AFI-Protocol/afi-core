import { SignalScorer } from '../validators/SignalScorer';
import { SignalSchema } from '../schemas/universal_signal_schema';

describe('SignalScorer', () => {
  it('scores numeric signals higher', () => {
    const validWithNum = SignalSchema.parse({
      id: '1',
      symbol: 'BTC',
      action: 'buy',
      content: 'BTC surged +5% on daily volume exceeding 2.3B USD. RSI > 70 and breakout confirmed on weekly chart.',
    });

    const validNoNum = SignalSchema.parse({
      id: '2',
      symbol: 'BTC',
      action: 'buy',
      content: 'Macro rumblings ahead with no concrete figures to support current speculation.',
    });

    const withNum = SignalScorer.evaluate(validWithNum);
    const noNum   = SignalScorer.evaluate(validNoNum);

    expect(withNum.insightScore).toBeGreaterThan(noNum.insightScore);
    expect(withNum.confidence).toBeGreaterThan(0.5);
  });
});