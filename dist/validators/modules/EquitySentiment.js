// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — EquitySentiment Module              ┃
// ┃ Role: Stock/equity sentiment and event scoring    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { ValidatorExtension } from '../ValidatorExtension.js';
export class EquitySentiment extends ValidatorExtension {
    name = 'EquitySentiment';
    description = 'Stock/equity sentiment analysis and event-driven scoring';
    evaluate(signal) {
        const content = signal?.content || signal?.note || '';
        const symbol = signal?.symbol || '';
        let sentiment = 50; // Base sentiment
        // Equity-specific sentiment indicators
        if (/earnings|dividend|buyback/i.test(content))
            sentiment += 15;
        if (/upgrade|downgrade|analyst/i.test(content))
            sentiment += 10;
        if (/merger|acquisition|ipo/i.test(content))
            sentiment += 20;
        if (/bankruptcy|delisting|scandal/i.test(content))
            sentiment -= 30;
        // Major stock symbols get slight boost
        if (/^(AAPL|MSFT|GOOGL|AMZN|TSLA)$/i.test(symbol))
            sentiment += 5;
        const composite = this.normalizeScore(sentiment);
        return {
            composite,
            breakdown: {
                poi: composite,
                insight: Math.max(0, composite - 5),
                confidence: Math.max(0, composite - 10)
            }
        };
    }
}
// Default export for CommonJS compatibility
export default EquitySentiment;
//# sourceMappingURL=EquitySentiment.js.map