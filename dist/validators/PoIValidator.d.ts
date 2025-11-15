export interface PoIResult {
    insightScore: number;
    confidence: number;
    derivedTags: string[];
    notes: string;
}
export declare class PoIValidator {
    static evaluate(signal: any): PoIResult;
}
//# sourceMappingURL=PoIValidator.d.ts.map