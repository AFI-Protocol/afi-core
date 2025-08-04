import { ValidationMetadata } from '../validators/types.js';
export interface VaultEntry {
    signalId: string;
    signal: any;
    metadata: ValidationMetadata;
    vaultedAt: string;
    challengeResults?: any[];
}
export declare class VaultService {
    /**
     * Vault a mature signal for long-term storage
     */
    static vaultSignal(signal: any, metadata: ValidationMetadata): void;
    /**
     * Simulate challenge for vaulted signal
     */
    static simulateChallenge(signalId: string): void;
    /**
     * Get vaulted signals
     */
    static getVaultedSignals(): VaultEntry[];
    /**
     * Query vault with filters
     */
    static queryVault(options: any): VaultEntry[];
}
//# sourceMappingURL=VaultService.d.ts.map