// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — CryptoMomentum Module               ┃
// ┃ Role: Crypto-specific breakout & volume scoring   ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { ValidatorExtension } from '../ValidatorExtension.js';
export class CryptoMomentum extends ValidatorExtension {
    name = 'CryptoMomentum';
    description = 'Crypto-specific breakout, volume, and price surge scoring';
    evaluate(signal) {
        const content = signal?.content || '';
        const symbol = signal?.symbol || '';
        let momentum = 50; // Base momentum
        // Crypto-specific momentum indicators
        if (/pump|surge|breakout|moon/i.test(content))
            momentum += 20;
        if (/volume|momentum/i.test(content))
            momentum += 15;
        if (/btc|bitcoin|eth|ethereum/i.test(symbol.toLowerCase()))
            momentum += 10;
        const composite = this.normalizeScore(momentum);
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
export default CryptoMomentum;
//# sourceMappingURL=CryptoMomentum.js.map