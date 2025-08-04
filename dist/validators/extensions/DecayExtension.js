// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Decay Extension                    ┃
// ┃ Applies time-based decay to signal scores         ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { ValidatorExtension } from '../ValidatorExtension.js';
export class DecayExtension extends ValidatorExtension {
    name = 'DecayExtension';
    description = 'Applies time-based decay to signal scores';
    evaluate(signal) {
        const timestamp = signal?.timestamp || new Date().toISOString();
        const signalAge = Date.now() - new Date(timestamp).getTime();
        const ageInHours = signalAge / (1000 * 60 * 60);
        let decayFactor = 1.0;
        // Apply time-based decay
        if (ageInHours > 24)
            decayFactor *= 0.8; // 1+ days old
        if (ageInHours > 168)
            decayFactor *= 0.6; // 1+ weeks old
        if (ageInHours > 720)
            decayFactor *= 0.4; // 1+ months old
        const baseScore = 75; // Assume decent base score
        const composite = this.normalizeScore(baseScore * decayFactor);
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
export default DecayExtension;
//# sourceMappingURL=DecayExtension.js.map