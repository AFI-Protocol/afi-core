import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { VaultService } from '../../src/core/VaultService.js';
import { BaselineValidator } from '../../validators/BaselineValidator.js';
import { logToCodex } from '../../utils/logCodex.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function replayVaultedSignal(vaultEntry) {
    const signalId = vaultEntry.signalId;
    const originalStage = vaultEntry.metadata?.lifecycleStage || 'unknown';
    try {
        console.log(`[afi-core] 🔄 Replaying signal: ${signalId}`);
        console.log(`[afi-core]   📊 Original stage: ${originalStage}`);
        console.log(`[afi-core]   🕐 Vaulted at: ${vaultEntry.vaultedAt}`);
        // Replay through BaselineValidator
        const replayResult = BaselineValidator.score(vaultEntry.signal, false); // Don't re-vault
        // Log to Codex with replay metadata
        const replayMetadata = {
            ...replayResult.metadata,
            isReplay: true,
            originalVaultedAt: vaultEntry.vaultedAt,
            replayedAt: new Date().toISOString()
        };
        logToCodex(vaultEntry.signal, replayMetadata);
        console.log(`[afi-core]   ✅ Replay score: ${replayResult.score}`);
        console.log(`[afi-core]   📈 New stage: ${replayResult.metadata.lifecycleStage}`);
        return {
            signalId,
            success: true,
            originalStage,
            replayStage: replayResult.metadata.lifecycleStage,
            score: replayResult.score
        };
    }
    catch (error) {
        console.error(`[afi-core] ❌ Error replaying ${signalId}:`, error);
        return {
            signalId,
            success: false,
            originalStage,
            replayStage: 'error',
            error: error.message
        };
    }
}
// Main execution
function main() {
    const args = process.argv.slice(2);
    // Parse command line arguments
    const limitIndex = args.indexOf('--limit');
    const filterIndex = args.indexOf('--filter');
    const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : undefined;
    const filter = filterIndex !== -1 && args[filterIndex + 1] ? args[filterIndex + 1] : undefined;
    console.log(`[afi-core] 🚀 Starting vault replay...`);
    console.log(`[afi-core] 📊 Filters: ${filter || 'none'}, limit: ${limit || 'none'}`);
    try {
        // Load vaulted signals
        let vaultedSignals = VaultService.getVaultedSignals();
        if (vaultedSignals.length === 0) {
            console.log(`[afi-core] ⚠️ No vaulted signals found`);
            process.exit(0);
        }
        console.log(`[afi-core] 📦 Found ${vaultedSignals.length} vaulted signals`);
        // Apply filters
        let queryOptions = {};
        if (filter) {
            // Parse filter format: "marketType:crypto" or "lifecycleStage:mature"
            const [filterType, filterValue] = filter.split(':');
            if (filterType && filterValue) {
                queryOptions[filterType] = filterValue;
            }
        }
        if (limit) {
            queryOptions.limit = limit;
        }
        // Query vault with filters
        if (Object.keys(queryOptions).length > 0) {
            vaultedSignals = VaultService.queryVault(queryOptions);
            console.log(`[afi-core] 🔍 Filtered to ${vaultedSignals.length} signals`);
        }
        if (vaultedSignals.length === 0) {
            console.log(`[afi-core] ⚠️ No signals found matching criteria`);
            process.exit(0);
        }
        // Replay each signal
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const vaultEntry of vaultedSignals) {
            const result = replayVaultedSignal(vaultEntry);
            results.push(result);
            if (result.success) {
                successCount++;
            }
            else {
                errorCount++;
            }
        }
        // Create summary
        const summary = {
            timestamp: new Date().toISOString(),
            totalSignals: vaultedSignals.length,
            successCount,
            errorCount,
            results,
            filters: queryOptions
        };
        // Write replay log
        const logPath = path.resolve(__dirname, '../../tmp/vault-replay.log.json');
        const tmpDir = path.dirname(logPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(logPath, JSON.stringify(summary, null, 2));
        // Summary output
        console.log(`[afi-core] 📊 Vault Replay Summary:`);
        console.log(`[afi-core]   ✅ Successful: ${successCount}`);
        console.log(`[afi-core]   ❌ Errors: ${errorCount}`);
        console.log(`[afi-core]   📈 Total: ${vaultedSignals.length}`);
        console.log(`[afi-core]   📄 Log: ${logPath}`);
        console.log(`[afi-core] ✅ Completed vault replay`);
        if (errorCount === 0) {
            process.exit(0);
        }
        else {
            process.exit(1);
        }
    }
    catch (err) {
        console.error(`[afi-core] 💥 Fatal error during vault replay:`, err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=replay-vault-signals.js.map