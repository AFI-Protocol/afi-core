// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — VaultService Implementation        ┃
// ┃ Signal storage and retrieval system              ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class VaultService {
    static vaultPath = path.join(__dirname, '../../tssd_vault');
    static vaultFile = path.join(VaultService.vaultPath, 'vault.json');
    /**
     * Initialize vault directory and file
     */
    static initialize() {
        if (!fs.existsSync(VaultService.vaultPath)) {
            fs.mkdirSync(VaultService.vaultPath, { recursive: true });
            console.log(`[VaultService] Created vault directory: ${VaultService.vaultPath}`);
        }
        if (!fs.existsSync(VaultService.vaultFile)) {
            const initialVault = { signals: [], stats: { totalSignals: 0, matureSignals: 0, challengedSignals: 0 } };
            fs.writeFileSync(VaultService.vaultFile, JSON.stringify(initialVault, null, 2));
            console.log(`[VaultService] Initialized vault file: ${VaultService.vaultFile}`);
        }
    }
    /**
     * Vault a mature signal
     */
    static vaultSignal(signal, metadata) {
        VaultService.initialize();
        const vaultEntry = {
            signalId: metadata.signalId || `vault_${Date.now()}`,
            signal,
            metadata,
            vaultedAt: new Date().toISOString(),
            challengeStatus: 'pending'
        };
        const vault = VaultService.loadVault();
        // Deduplicate signals
        const existingIndex = vault.signals.findIndex((s) => s.signalId === vaultEntry.signalId);
        if (existingIndex >= 0) {
            vault.signals[existingIndex] = vaultEntry;
        }
        else {
            vault.signals.push(vaultEntry);
            vault.stats.totalSignals++;
            if (metadata.lifecycleStage === 'mature')
                vault.stats.matureSignals++;
        }
        vault.stats.lastVaultedAt = vaultEntry.vaultedAt;
        VaultService.saveVault(vault);
        console.log(`[VaultService] ✅ Vaulted signal: ${vaultEntry.signalId}`);
    }
    /**
     * Retrieve all vaulted signals
     */
    static getVaultedSignals() {
        const vault = VaultService.loadVault();
        return vault.signals;
    }
    /**
     * Replay a vaulted signal
     */
    static replaySignal(signalId) {
        const vault = VaultService.loadVault();
        const entry = vault.signals.find((s) => s.signalId === signalId);
        if (entry)
            console.log(`[VaultService] 🔄 Replaying signal: ${signalId}`);
        return entry || null;
    }
    /**
     * Load vault from disk
     */
    static loadVault() {
        try {
            const data = fs.readFileSync(VaultService.vaultFile, 'utf8');
            return JSON.parse(data);
        }
        catch {
            console.warn('[VaultService] Failed to load vault, returning empty vault');
            return { signals: [], stats: { totalSignals: 0, matureSignals: 0, challengedSignals: 0 } };
        }
    }
    /**
     * Save vault to disk
     */
    static saveVault(vault) {
        fs.writeFileSync(VaultService.vaultFile, JSON.stringify(vault, null, 2));
    }
}
//# sourceMappingURL=VaultService.js.map