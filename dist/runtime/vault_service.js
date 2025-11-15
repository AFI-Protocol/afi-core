import fs from 'fs';
import path from 'path';
export class VaultService {
    vaultPath;
    constructor(vaultPath) {
        // Use tssd_vault directory to match test expectations
        this.vaultPath = vaultPath || path.join(process.cwd(), 'tssd_vault', 'vault.json');
    }
    /**
     * Initialize vault file if it doesn't exist
     */
    initializeVault() {
        try {
            const vaultDir = path.dirname(this.vaultPath);
            if (!fs.existsSync(vaultDir)) {
                fs.mkdirSync(vaultDir, { recursive: true });
            }
            if (!fs.existsSync(this.vaultPath)) {
                fs.writeFileSync(this.vaultPath, JSON.stringify([], null, 2));
                console.log(`[VaultService] Initialized vault file: ${this.vaultPath}`);
            }
        }
        catch (error) {
            console.error(`[VaultService] Failed to initialize vault:`, error);
        }
    }
    /**
     * Query vault with filters and proper result handling
     */
    queryVault(filters = {}, limit) {
        this.initializeVault(); // Ensure vault exists
        const vault = this.loadVault();
        let results = [...vault];
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            results = results.filter(signal => {
                // Handle nested properties (e.g., meta.marketType)
                if (key.includes('.')) {
                    const keys = key.split('.');
                    let obj = signal;
                    for (const k of keys) {
                        obj = obj?.[k];
                        if (obj === undefined)
                            return false;
                    }
                    return obj === value;
                }
                // Handle direct properties
                if (key === 'marketType') {
                    // Check both direct and nested marketType
                    return signal.marketType === value || signal.meta?.marketType === value;
                }
                if (key === 'lifecycleStage') {
                    // Check both direct and nested lifecycleStage
                    return signal.lifecycleStage === value || signal.meta?.lifecycleStage === value;
                }
                return signal[key] === value;
            });
        });
        // Apply limit
        if (limit && limit > 0) {
            results = results.slice(0, limit);
        }
        return results;
    }
    /**
     * Get vault statistics
     */
    getVaultStatistics() {
        const vault = this.loadVault();
        const stats = {
            total: vault.length,
            byStage: {},
            byMarketType: {}
        };
        vault.forEach(signal => {
            // Count by lifecycle stage
            const stage = signal.lifecycleStage || signal.meta?.lifecycleStage || 'unknown';
            stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
            // Count by market type
            const marketType = signal.marketType || signal.meta?.marketType || 'unknown';
            stats.byMarketType[marketType] = (stats.byMarketType[marketType] || 0) + 1;
        });
        return stats;
    }
    /**
     * Check if signal is already vaulted (prevent duplicates)
     */
    isSignalVaulted(signalId) {
        const vault = this.loadVault();
        return vault.some(signal => signal.id === signalId || signal.originalId === signalId);
    }
    /**
     * Vault a signal with proper metadata and duplicate prevention
     */
    vaultSignal(signal, metadata) {
        try {
            this.initializeVault();
            // Prevent duplicate vaulting
            if (this.isSignalVaulted(signal.id)) {
                console.log(`[VaultService] Signal already vaulted: ${signal.id}`);
                return false;
            }
            const vault = this.loadVault();
            // Create vaulted signal with proper structure
            const vaultedSignal = {
                ...signal,
                vaultedAt: new Date().toISOString(),
                originalId: signal.id,
                marketType: metadata?.marketType || this.inferMarketType(signal),
                lifecycleStage: metadata?.lifecycleStage || 'mature',
                meta: {
                    ...metadata,
                    marketType: metadata?.marketType || this.inferMarketType(signal),
                    lifecycleStage: metadata?.lifecycleStage || 'mature',
                    vaultReason: 'lifecycle_transition'
                }
            };
            vault.push(vaultedSignal);
            // Write vault
            fs.writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2));
            console.log(`[VaultService] ✅ Vaulted signal: ${signal.id}`);
            return true;
        }
        catch (error) {
            console.error(`[VaultService] Failed to vault signal:`, error);
            return false;
        }
    }
    /**
     * Replay signal from vault
     */
    replaySignal(signalId) {
        const vault = this.loadVault();
        const signal = vault.find(s => s.id === signalId || s.originalId === signalId);
        if (!signal) {
            console.log(`[VaultService] Signal not found in vault: ${signalId}`);
            return null;
        }
        // Add replay metadata
        const replayedSignal = {
            ...signal,
            id: `replay_${Date.now()}`, // Generate new ID for replay
            replayedAt: new Date().toISOString(),
            originalSignalId: signal.originalId || signal.id,
            meta: {
                ...signal.meta,
                isReplay: true,
                replaySource: 'vault'
            }
        };
        return replayedSignal;
    }
    /**
     * Load vault with error handling
     */
    loadVault() {
        try {
            if (!fs.existsSync(this.vaultPath)) {
                return [];
            }
            const data = fs.readFileSync(this.vaultPath, 'utf-8');
            if (!data.trim()) {
                return [];
            }
            const vault = JSON.parse(data);
            return Array.isArray(vault) ? vault : [];
        }
        catch (error) {
            console.log(`[VaultService] Failed to load vault, returning empty vault`);
            return [];
        }
    }
    /**
     * Handle vault corruption gracefully
     */
    handleCorruption() {
        try {
            // Create backup of corrupted file
            const backupPath = `${this.vaultPath}.corrupted.${Date.now()}`;
            if (fs.existsSync(this.vaultPath)) {
                fs.copyFileSync(this.vaultPath, backupPath);
            }
            // Initialize new vault
            this.initializeVault();
            console.log(`[VaultService] Vault corruption handled, backup created: ${backupPath}`);
            return true;
        }
        catch (error) {
            console.error(`[VaultService] Failed to handle vault corruption:`, error);
            return false;
        }
    }
    /**
     * Infer market type from signal
     */
    inferMarketType(signal) {
        const symbol = signal?.symbol || '';
        const content = signal?.content || '';
        // Crypto patterns
        if (/btc|bitcoin|eth|ethereum|crypto/i.test(symbol + content)) {
            return 'crypto';
        }
        // Stock patterns
        if (/stock|equity|nasdaq|nyse/i.test(content) || /^[A-Z]{1,5}$/.test(symbol)) {
            return 'stock';
        }
        return 'unknown';
    }
    /**
     * Get all vaulted signals
     */
    getVaultedSignals() {
        this.initializeVault();
        return this.loadVault();
    }
    /**
     * Get vault statistics for tests
     */
    getVaultStats() {
        const vault = this.loadVault();
        if (vault.length === 0) {
            return { totalSignals: 0 };
        }
        // Sort by vaultedAt timestamp
        const sorted = vault.sort((a, b) => new Date(a.vaultedAt || 0).getTime() - new Date(b.vaultedAt || 0).getTime());
        return {
            totalSignals: vault.length,
            oldestEntry: sorted[0]?.vaultedAt,
            newestEntry: sorted[sorted.length - 1]?.vaultedAt
        };
    }
    /**
     * Static version for test compatibility
     */
    static getVaultStats() {
        const service = new VaultService();
        return service.getVaultStats();
    }
    /**
     * Static version for test compatibility
     */
    static vaultSignal(signal, metadata) {
        const service = new VaultService();
        return service.vaultSignal(signal, metadata);
    }
    /**
     * Static version for getting vaulted signals
     */
    static getVaultedSignals() {
        const service = new VaultService();
        return service.getVaultedSignals();
    }
    /**
     * Static version for querying vault
     */
    static queryVault(filters = {}, options) {
        const service = new VaultService();
        return service.queryVault(filters, options?.limit);
    }
    /**
     * Static version for replaying signals
     */
    static replaySignal(signalId) {
        const service = new VaultService();
        return service.replaySignal(signalId);
    }
}
//# sourceMappingURL=vault_service.js.map