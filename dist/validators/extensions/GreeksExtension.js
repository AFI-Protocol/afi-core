// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Greeks Extension                   ┃
// ┃ Applies financial Greeks-inspired analysis        ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { ValidatorExtension } from '../ValidatorExtension.js';
export class GreeksExtension extends ValidatorExtension {
    name = 'GreeksExtension';
    description = 'Applies financial Greeks-inspired analysis to signals';
    evaluate(signal) {
        const content = signal?.content || '';
        const symbol = signal?.symbol || '';
        let greeksScore = 50;
        // Greeks-inspired analysis
        if (/delta|gamma|theta|vega|rho/i.test(content))
            greeksScore += 15;
        if (/volatility|time decay|sensitivity/i.test(content))
            greeksScore += 10;
        if (/options|derivatives/i.test(content))
            greeksScore += 20;
        const composite = this.normalizeScore(greeksScore);
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
export default GreeksExtension;
//# sourceMappingURL=GreeksExtension.js.map