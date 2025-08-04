#!/usr/bin/env node
// Comprehensive Phase 2 validation script
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
console.log('🚀 AFI-Core Phase 2 Recovery - Comprehensive Validation');
console.log('======================================================');
const results = {
    build: { status: 'pending', errors: [] },
    tests: { status: 'pending', errors: [] },
    runtime: { status: 'pending', errors: [] },
    structure: { status: 'pending', errors: [] }
};
async function runCommand(command, args = []) {
    return new Promise((resolve) => {
        const process = spawn(command, args, { stdio: 'pipe' });
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => stdout += data.toString());
        process.stderr.on('data', (data) => stderr += data.toString());
        process.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });
    });
}
async function validateBuild() {
    console.log('\n🔨 Running Build Validation...');
    const result = await runCommand('npm', ['run', 'build:clean']);
    if (result.code === 0) {
        results.build.status = 'passed';
        console.log('✅ Build: PASSED');
    }
    else {
        results.build.status = 'failed';
        results.build.errors.push(result.stderr);
        console.log('❌ Build: FAILED');
        console.log(result.stderr);
    }
}
async function validateTests() {
    console.log('\n🧪 Running Test Validation...');
    const result = await runCommand('npm', ['run', 'test:run']);
    if (result.code === 0) {
        results.tests.status = 'passed';
        console.log('✅ Tests: PASSED');
    }
    else {
        results.tests.status = 'failed';
        results.tests.errors.push(result.stderr);
        console.log('❌ Tests: FAILED');
        console.log(result.stderr);
    }
}
async function validateRuntime() {
    console.log('\n⚡ Running Runtime Validation...');
    const result = await runCommand('node', ['validation-check.js']);
    if (result.code === 0) {
        results.runtime.status = 'passed';
        console.log('✅ Runtime: PASSED');
    }
    else {
        results.runtime.status = 'failed';
        results.runtime.errors.push(result.stderr);
        console.log('❌ Runtime: FAILED');
        console.log(result.stderr);
    }
}
async function validateStructure() {
    console.log('\n📁 Running Structure Validation...');
    const result = await runCommand('node', ['structure-check.js']);
    if (result.code === 0) {
        results.structure.status = 'passed';
        console.log('✅ Structure: PASSED');
    }
    else {
        results.structure.status = 'failed';
        results.structure.errors.push(result.stderr);
        console.log('❌ Structure: FAILED');
        console.log(result.stderr);
    }
}
// Run all validations
await validateBuild();
await validateTests();
await validateRuntime();
await validateStructure();
// Generate summary report
const summary = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 2 Recovery Validation',
    results,
    overallStatus: Object.values(results).every(r => r.status === 'passed') ? 'PASSED' : 'FAILED'
};
writeFileSync('phase2-validation-report.json', JSON.stringify(summary, null, 2));
console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');
console.log(`🔨 Build: ${results.build.status.toUpperCase()}`);
console.log(`🧪 Tests: ${results.tests.status.toUpperCase()}`);
console.log(`⚡ Runtime: ${results.runtime.status.toUpperCase()}`);
console.log(`📁 Structure: ${results.structure.status.toUpperCase()}`);
console.log(`\n🎯 OVERALL STATUS: ${summary.overallStatus}`);
if (summary.overallStatus === 'PASSED') {
    console.log('\n🎉 AFI-Core Phase 2 Recovery COMPLETE');
    console.log('✅ Repository is ready for Architecture Implementation Phase');
    process.exit(0);
}
else {
    console.log('\n❌ AFI-Core Phase 2 Recovery INCOMPLETE');
    console.log('⚠️  Issues must be resolved before Architecture Implementation Phase');
    process.exit(1);
}
//# sourceMappingURL=validate-phase2.js.map