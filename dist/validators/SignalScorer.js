// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — SignalScorer                       ┃
// ┃ Role: Quantifies insight strength for signals     ┃
// ┃ Features: Numeric bias, length & sentiment scoring┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class SignalScorer {
    static evaluate(signal) {
        const content = signal.content ?? signal.notes ?? '';
        // Base scores
        let baseScore = content.length > 0 ? 1 : 0;
        const hasNumbers = /\d/.test(content);
        // Length factor: weak signals stay <20
        const lengthFactor = Math.min(content.length / 10, 2);
        // Numeric signals get a slight guaranteed boost
        const numericBonus = hasNumbers ? 0.1 : 0;
        // Calculate final insightScore
        const insightScore = Number((baseScore * lengthFactor + numericBonus).toFixed(2));
        // Confidence is higher for numeric signals
        const confidence = hasNumbers
            ? Math.min(0.6 + insightScore / 100, 1)
            : Math.min(0.5, insightScore / 100);
        return { insightScore, confidence };
    }
}
//# sourceMappingURL=SignalScorer.js.map