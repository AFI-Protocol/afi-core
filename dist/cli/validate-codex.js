#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
function validateCodex() {
    try {
        const codexPath = join(process.cwd(), '.afi-codex');
        const codex = JSON.parse(readFileSync(codexPath, 'utf8'));
        const required = ['name', 'role', 'description', 'language'];
        const missing = required.filter(field => !codex[field]);
        if (missing.length > 0) {
            console.error('❌ Missing required fields:', missing.join(', '));
            process.exit(1);
        }
        console.log('✅ .afi-codex validation passed');
        console.log(`   Name: ${codex.name}`);
        console.log(`   Role: ${codex.role}`);
        console.log(`   Factory Ready: ${codex.factory_ready ? '✅' : '❌'}`);
    }
    catch (error) {
        console.error('❌ Codex validation failed:', error.message);
        process.exit(1);
    }
}
validateCodex();
//# sourceMappingURL=validate-codex.js.map