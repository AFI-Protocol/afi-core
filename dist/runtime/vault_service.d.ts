export declare class VaultService {
    private vaultPath;
    constructor(vaultPath?: string);
    /**
     * Initialize vault file if it doesn't exist
     */
    initializeVault(): void;
    /**
     * Query vault with filters and proper result handling
     */
    queryVault(filters?: Record<string, any>, limit?: number): any[];
    /**
     * Get vault statistics
     */
    getVaultStatistics(): {
        total: number;
        byStage: Record<string, number>;
        byMarketType: Record<string, number>;
    };
    /**
     * Check if signal is already vaulted (prevent duplicates)
     */
    isSignalVaulted(signalId: string): boolean;
    /**
     * Vault a signal with proper metadata and duplicate prevention
     */
    vaultSignal(signal: any, metadata?: any): boolean;
    /**
     * Replay signal from vault
     */
    replaySignal(signalId: string): any | null;
    /**
     * Load vault with error handling
     */
    private loadVault;
    /**
     * Handle vault corruption gracefully
     */
    handleCorruption(): boolean;
    /**
     * Infer market type from signal
     */
    private inferMarketType;
    /**
     * Get all vaulted signals
     */
    getVaultedSignals(): any[];
    /**
     * Get vault statistics for tests
     */
    getVaultStats(): {
        totalSignals: number;
        oldestEntry?: string;
        newestEntry?: string;
    };
    /**
     * Static version for test compatibility
     */
    static getVaultStats(): {
        totalSignals: number;
        oldestEntry?: string;
        newestEntry?: string;
    };
    /**
     * Static version for test compatibility
     */
    static vaultSignal(signal: any, metadata?: any): boolean;
    /**
     * Static version for getting vaulted signals
     */
    static getVaultedSignals(): any[];
    /**
     * Static version for querying vault
     */
    static queryVault(filters?: Record<string, any>, options?: {
        limit?: number;
    }): any[];
    /**
     * Static version for replaying signals
     */
    static replaySignal(signalId: string): any | null;
}
//# sourceMappingURL=vault_service.d.ts.map