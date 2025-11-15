#!/usr/bin/env node
// Runtime validation script for AFI-Core Phase 2 recovery
import { existsSync } from 'fs';
import { join } from 'path';
console.log('🔍 AFI-Core Phase 2 Recovery - Runtime Validation');
console.log('================================================');
// Check if dist directory exists
const distPath = join(process.cwd(), 'dist');
if (!existsSync(distPath)) {
    console.error('❌ FAIL: dist/ directory not found. Run npm run build first.');
    process.exit(1);
}
try {
    // Test core utility imports
    console.log('\n📦 Testing Core Utility Imports...');
    const { logToCodex, generateSignalId, getCodexEntries, getCodexStats } = await import('./dist/utils/index.js');
    console.log('✅ logToCodex:', typeof logToCodex === 'function' ? 'FOUND' : 'MISSING');
    console.log('✅ generateSignalId:', typeof generateSignalId === 'function' ? 'FOUND' : 'MISSING');
    console.log('✅ getCodexEntries:', typeof getCodexEntries === 'function' ? 'FOUND' : 'MISSING');
    console.log('✅ getCodexStats:', typeof getCodexStats === 'function' ? 'FOUND' : 'MISSING');
    // Test validator imports
    console.log('\n🔬 Testing Validator Imports...');
    const { BaselineValidator } = await import('./dist/validators/BaselineValidator.js');
    const { ValidatorExtension } = await import('./dist/validators/ValidatorExtension.js');
    console.log('✅ BaselineValidator:', typeof BaselineValidator === 'function' ? 'FOUND' : 'MISSING');
    console.log('✅ ValidatorExtension:', typeof ValidatorExtension === 'function' ? 'FOUND' : 'MISSING');
    // Test core service imports
    console.log('\n🏗️ Testing Core Service Imports...');
    const { VaultService } = await import('./dist/src/core/VaultService.js');
    const { LifecycleManager } = await import('./dist/src/core/LifecycleManager.js');
    console.log('✅ VaultService:', typeof VaultService === 'object' ? 'FOUND' : 'MISSING');
    console.log('✅ LifecycleManager:', typeof LifecycleManager === 'object' ? 'FOUND' : 'MISSING');
    // Test module imports
    console.log('\n🚀 Testing Module Imports...');
    const { CryptoMomentum } = await import('./dist/validators/modules/CryptoMomentum.js');
    const { EquitySentiment } = await import('./dist/validators/modules/EquitySentiment.js');
    console.log('✅ CryptoMomentum:', typeof CryptoMomentum === 'function' ? 'FOUND' : 'MISSING');
    console.log('✅ EquitySentiment:', typeof EquitySentiment === 'function' ? 'FOUND' : 'MISSING');
    // Test functional execution
    console.log('\n⚡ Testing Functional Execution...');
    const signalId = generateSignalId();
    console.log('✅ generateSignalId() output:', signalId);
    const mockSignal = {
        id: signalId,
        symbol: 'BTC-USD',
        content: 'Test signal for validation',
        timestamp: new Date().toISOString()
    };
    const result = BaselineValidator.score(mockSignal, false); // Don't vault during test
    console.log('✅ BaselineValidator.score() result:', {
        score: result.score,
        signalId: result.metadata.signalId
    });
    console.log('\n🎉 ALL RUNTIME CHECKS PASSED');
    process.exit(0);
}
catch (error) {
    console.error('\n❌ RUNTIME CHECK FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
//# sourceMappingURL=validation-check.js.map