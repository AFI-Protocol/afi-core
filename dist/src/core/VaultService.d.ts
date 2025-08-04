export interface VaultEntry {
    signalId: string;
    signal: any;
    metadata: any;
    vaultedAt: string;
    challengeStatus?: 'pending' | 'validated' | 'rejected';
}
export interface VaultStats {
    totalSignals: number;
    matureSignals: number;
    challengedSignals: number;
    lastVaultedAt?: string;
}
export declare class VaultService {
    private static vaultPath;
    private static vaultFile;
    /**
     * Initialize vault directory and file
     */
    static initialize(): void;
    /**
     * Vault a mature signal
     */
    static vaultSignal(signal: any, metadata: any): void;
    /**
     * Retrieve all vaulted signals
     */
    static getVaultedSignals(): VaultEntry[];
    /**
     * Replay a vaulted signal
     */
    static replaySignal(signalId: string): VaultEntry | null;
    /**
     * Load vault from disk
     */
    private static loadVault;
    /**
     * Save vault to disk
     */
    private static saveVault;
}
//# sourceMappingURL=VaultService.d.ts.map