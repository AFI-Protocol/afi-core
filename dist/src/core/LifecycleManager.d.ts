export interface LifecycleStage {
    name: string;
    description: string;
    minScore: number;
    maxAge: number;
    vaultEligible: boolean;
}
export interface ValidationMetadata {
    signalId: string;
    lifecycleStage: string;
    finalComposite: number;
    timestamp: string;
    ageInMs: number;
    stageTransition?: {
        from: string;
        to: string;
    };
    stageTransitions?: string[];
    vaultEligible?: boolean;
}
export declare const LIFECYCLE_STAGES: LifecycleStage[];
export declare class LifecycleManager {
    /**
     * Determine lifecycle stage based on score and age
     */
    static determineStage(signal: any, fallbackStage?: string): string;
    /**
     * Update signal lifecycle stage based on score and age
     */
    static updateLifecycle(signal: any, metadata: ValidationMetadata): ValidationMetadata;
    /**
     * Whether a stage is vault‑eligible
     */
    static isVaultEligible(stage: string, score: number): boolean;
    /**
     * Public shouldVault for BaselineValidator integration
     */
    static shouldVault(metadata: ValidationMetadata): boolean;
    /**
     * Get stage summary for an array of signals
     */
    static getStageSummary(signals: ValidationMetadata[]): Record<string, number>;
}
//# sourceMappingURL=LifecycleManager.d.ts.map