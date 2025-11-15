export interface ValidationMetadata {
    signalId: string;
    timestamp: string;
    validator: string;
    extensions: ValidatorExtensionResult[];
    finalComposite: number;
    marketType: string;
    decayStage: string;
    symbol?: string;
    lifecycleStage: string;
    stageTransition: {
        from: string;
        to: string;
    };
    ageInMs: number;
    stageTransitions: string[];
}
export interface ValidatorExtensionResult {
    name: string;
    composite: number;
    breakdown: {
        poi: number;
        insight: number;
        confidence: number;
    };
    score: number;
    metadata?: Record<string, any>;
}
export interface ValidationResult {
    score: number;
    composite: number;
    breakdown: {
        poi: number;
        insight: number;
        confidence: number;
    };
    metadata: ValidationMetadata;
}
export interface BaselineEvaluation {
    score: number;
    notes?: string;
}
export interface BaselineScore {
    composite: number;
    breakdown: {
        poi: number;
        insight: number;
        confidence: number;
    };
    metadata: ValidationMetadata;
}
//# sourceMappingURL=types.d.ts.map