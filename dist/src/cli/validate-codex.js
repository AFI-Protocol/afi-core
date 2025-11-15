#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { basename } from 'path';
function validateCodex() {
    console.log('[validate-codex] CLI stub is running...');
    try {
        // Look for codex file relative to project root
        const codexPath = join(process.cwd(), 'tssd_registry', '.afi-codex.json');
        if (!existsSync(codexPath)) {
            console.log('[validate-codex] No codex found. Nothing to validate yet.');
            process.exit(0);
        }
        // Parse and validate JSON
        const codexContent = readFileSync(codexPath, 'utf8');
        const codex = JSON.parse(codexContent);
        if (!Array.isArray(codex)) {
            console.error('[validate-codex] Error: Codex must be a JSON array');
            process.exit(1);
        }
        console.log(`[validate-codex] Found ${codex.length} entries in codex`);
        // Bonus: Log extension and decay stage info if available
        let extensionCount = 0;
        const decayStages = new Set();
        codex.forEach((entry) => {
            if (entry.meta?.extensions) {
                extensionCount += entry.meta.extensions.length;
            }
            if (entry.meta?.decayStage) {
                decayStages.add(entry.meta.decayStage);
            }
        });
        if (extensionCount > 0) {
            console.log(`[validate-codex] Total extension evaluations: ${extensionCount}`);
        }
        if (decayStages.size > 0) {
            console.log(`[validate-codex] Decay stages found: ${Array.from(decayStages).join(', ')}`);
        }
        console.log('[validate-codex] ✅ Codex validation passed');
        process.exit(0);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            console.error('[validate-codex] ❌ JSON parsing failed:', error.message);
        }
        else {
            console.error('[validate-codex] ❌ Validation failed:', error.message);
        }
        process.exit(1);
    }
}
// ESM-safe entrypoint check
const isMain = basename(fileURLToPath(import.meta.url)) === 'validate-codex.js';
if (isMain) {
    validateCodex();
}
export { validateCodex as main, validateCodex };
//# sourceMappingURL=validate-codex.js.map