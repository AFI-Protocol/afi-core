// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Signal Validator (Stub)           ┃
// ┃ Core signal validation and scoring logic         ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class SignalValidator {
    static validate(signal) {
        // Stub implementation - to be expanded in Phase 2
        const errors = [];
        const warnings = [];
        if (!signal) {
            errors.push('Signal is null or undefined');
        }
        if (!signal?.content && !signal?.notes) {
            errors.push('Signal missing content or notes');
        }
        const isValid = errors.length === 0;
        const score = isValid ? 75 : 0; // Default score for valid signals
        return {
            isValid,
            score,
            errors,
            warnings
        };
    }
}
//# sourceMappingURL=SignalValidator.js.map