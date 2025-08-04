export interface SignalValidationResult {
    isValid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
}
export declare class SignalValidator {
    static validate(signal: any): SignalValidationResult;
}
//# sourceMappingURL=SignalValidator.d.ts.map