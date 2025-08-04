export declare class LifecycleManager {
    /**
     * Determine lifecycle stage based on signal age and decay stage
     */
    static determineStage(signal: any, decayStage?: string): string;
    /**
     * Update lifecycle with proper stage transitions
     */
    static updateLifecycle(signal: any, metadata: any): any;
    /**
     * Get stage summary statistics - count signals by their metadata.lifecycleStage
     */
    static getStageSummary(signals: any[]): Record<string, number>;
    /**
     * Update metadata with lifecycle information
     */
    static updateMetadata(signal: any, metadata: any): any;
    /**
     * Process lifecycle stage transition
     */
    static processStageTransition(signal: any): string;
}
//# sourceMappingURL=lifecycle_manager.d.ts.map