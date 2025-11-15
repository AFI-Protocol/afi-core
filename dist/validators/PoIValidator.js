// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — PoI Validator (Stub)              ┃
// ┃ Point of Interest validation logic               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class PoIValidator {
    static evaluate(signal) {
        // Stub implementation - to be expanded in Phase 2
        const content = signal?.content || signal?.notes || '';
        const lengthFactor = Math.min(content.length / 280, 1);
        const hasNumbers = /\d/.test(content) ? 1 : 0.6;
        const sentiment = /risk|alert|warning/i.test(content) ? 'risk' : 'macro';
        const insightScore = Math.round(100 * lengthFactor * hasNumbers);
        const confidence = Number((0.4 + 0.6 * lengthFactor).toFixed(2));
        return {
            insightScore,
            confidence,
            derivedTags: [sentiment],
            notes: `LengthFactor=${lengthFactor.toFixed(2)}, numeric=${!!hasNumbers}`
        };
    }
}
//# sourceMappingURL=PoIValidator.js.map