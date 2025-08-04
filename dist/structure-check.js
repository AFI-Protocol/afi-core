#!/usr/bin/env node
// File structure validation for AFI-Core Phase 2 recovery
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
console.log('📁 AFI-Core File Structure Validation');
console.log('====================================');
const checks = [
    {
        name: 'Canonical Codex Source',
        path: 'utils/logCodex.ts',
        required: true,
        contains: ['logToCodex', 'generateSignalId', 'getCodexEntries']
    },
    {
        name: 'Clean Utils Index',
        path: 'utils/index.ts',
        required: true,
        contains: ['export * from \'./logCodex.js\'']
    },
    {
        name: 'Validator Types Hub',
        path: 'validators/types.ts',
        required: true,
        contains: ['ValidationMetadata', 'BaselineScore', 'ValidationResult']
    },
    {
        name: 'CryptoMomentum Fixed Import',
        path: 'validators/modules/CryptoMomentum.ts',
        required: true,
        contains: ['from \'../types.js\'']
    },
    {
        name: 'EquitySentiment Fixed Import',
        path: 'validators/modules/EquitySentiment.ts',
        required: true,
        contains: ['from \'../types.js\'']
    }
];
let allPassed = true;
checks.forEach(check => {
    const filePath = join(process.cwd(), check.path);
    if (!existsSync(filePath)) {
        console.log(`❌ ${check.name}: File missing - ${check.path}`);
        allPassed = false;
        return;
    }
    const content = readFileSync(filePath, 'utf8');
    const missingItems = check.contains.filter(item => !content.includes(item));
    if (missingItems.length > 0) {
        console.log(`⚠️  ${check.name}: Missing content - ${missingItems.join(', ')}`);
        allPassed = false;
    }
    else {
        console.log(`✅ ${check.name}: PASSED`);
    }
});
// Check for duplicate functions (anti-pattern detection)
console.log('\n🔍 Checking for Duplicate Functions...');
const utilsIndex = join(process.cwd(), 'utils/index.ts');
if (existsSync(utilsIndex)) {
    const content = readFileSync(utilsIndex, 'utf8');
    // Should NOT contain direct function definitions for codex utilities
    const duplicatePatterns = [
        'function logToCodex',
        'function generateSignalId',
        'export function logToCodex',
        'export function generateSignalId'
    ];
    const foundDuplicates = duplicatePatterns.filter(pattern => content.includes(pattern));
    if (foundDuplicates.length > 0) {
        console.log(`❌ Duplicate Functions Found: ${foundDuplicates.join(', ')}`);
        allPassed = false;
    }
    else {
        console.log('✅ No Duplicate Functions: PASSED');
    }
}
if (allPassed) {
    console.log('\n🎉 ALL STRUCTURE CHECKS PASSED');
    process.exit(0);
}
else {
    console.log('\n❌ STRUCTURE VALIDATION FAILED');
    process.exit(1);
}
//# sourceMappingURL=structure-check.js.map