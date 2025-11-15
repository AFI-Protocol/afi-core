// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — EnsembleScorer (Stub)              ┃
// ┃ Role: Placeholder for unified scoring logic       ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class EnsembleScorer {
    static score(signal) {
        // Basic stub implementation for tests
        const content = signal?.content || signal?.notes || '';
        const hasNumbers = /\d/.test(content);
        // Simple scoring logic for test compatibility
        const poi = hasNumbers ? 50 : 20;
        const insight = content.length > 30 ? 40 : 15;
        const composite = Math.round(poi * 0.6 + insight * 0.4);
        return {
            composite,
            breakdown: { poi, insight }
        };
    }
}
//# sourceMappingURL=EnsembleScorer.js.map