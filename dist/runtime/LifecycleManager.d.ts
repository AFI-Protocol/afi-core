import { ValidationMetadata } from '../validators/types.js';
export interface LifecycleStage {
    name: string;
    minAge: number;
    maxAge: number;
    vaultEligible: boolean;
}
export declare class LifecycleManager {
    /**
     * Update signal lifecycle based on age and current stage
     */
    static updateLifecycle(signal: any, metadata: ValidationMetadata): ValidationMetadata;
    /**
     * Determine if signal should be vaulted
     */
    static shouldVault(metadata: ValidationMetadata): boolean;
    /**
     * Get signal age in hours
     */
    private static getSignalAge;
    /**
     * Determine lifecycle stage based on age
     */
    private static determineStage;
}
//# sourceMappingURL=LifecycleManager.d.ts.map