// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — logCodex Utility       ┃
// ┃ Purpose: Logs signal data to codex    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import fs from 'fs';
import path from 'path';
const CODEX_PATH = path.join(process.cwd(), 'tssd_registry', '.afi-codex.json');
/**
 * Log validation result to codex registry
 */
export function logToCodex(signal, result) {
    try {
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(CODEX_PATH))) {
            fs.mkdirSync(path.dirname(CODEX_PATH), { recursive: true });
        }
        // Initialize codex file if it doesn't exist
        if (!fs.existsSync(CODEX_PATH)) {
            fs.writeFileSync(CODEX_PATH, JSON.stringify([], null, 2));
        }
        // Read existing codex
        let codex = [];
        try {
            const existing = fs.readFileSync(CODEX_PATH, 'utf-8');
            codex = JSON.parse(existing);
        }
        catch (parseError) {
            console.warn('[logCodex] Invalid codex file, reinitializing...');
            codex = [];
        }
        // Extract metadata from result
        const metadata = result?.metadata || {};
        // Preserve original signal ID - this is the key fix
        const signalId = signal?.id || metadata.signalId || generateSignalId();
        // Create new entry
        const entry = {
            signalId: signalId, // Use preserved ID
            timestamp: metadata.timestamp || new Date().toISOString(),
            validator: metadata.validator || 'BaselineValidator',
            score: metadata.finalComposite || result?.score || 0,
            marketType: metadata.marketType || 'unknown',
            symbol: signal?.symbol || 'UNKNOWN',
            meta: {
                extensions: metadata.extensions || [],
                decayStage: metadata.decayStage || 'fresh',
                lifecycleStage: metadata.lifecycleStage || 'active',
                stageTransition: metadata.stageTransition || false
            }
        };
        // Add entry and limit size
        codex.push(entry);
        if (codex.length > 1000) {
            codex = codex.slice(-1000); // Keep last 1000 entries
        }
        // Write back to file
        fs.writeFileSync(CODEX_PATH, JSON.stringify(codex, null, 2));
    }
    catch (error) {
        console.error('[logCodex] Failed to log to codex:', error);
    }
}
/**
 * Get codex entries for analysis
 */
export function getCodexEntries() {
    try {
        if (!fs.existsSync(CODEX_PATH)) {
            return [];
        }
        const content = fs.readFileSync(CODEX_PATH, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('[logCodex] Failed to read codex:', error);
        return [];
    }
}
/**
 * Generate unique signal ID
 */
export function generateSignalId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `sig_${timestamp}_${random}`;
}
/**
 * Get codex statistics
 */
export function getCodexStats() {
    try {
        const entries = getCodexEntries();
        if (entries.length === 0) {
            return { totalSignals: 0, lastUpdated: null };
        }
        const lastEntry = entries[entries.length - 1];
        return {
            totalSignals: entries.length,
            lastUpdated: lastEntry.timestamp
        };
    }
    catch (error) {
        console.error('[getCodexStats] Failed to read codex stats:', error);
        return { totalSignals: 0, lastUpdated: null };
    }
}
//# sourceMappingURL=logCodex.js.map