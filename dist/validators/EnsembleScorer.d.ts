export interface EnsembleScore {
    composite: number;
    breakdown: {
        poi: number;
        insight: number;
    };
}
export declare class EnsembleScorer {
    static score(signal: any): EnsembleScore;
}
//# sourceMappingURL=EnsembleScorer.d.ts.map