/**
 * AFI Protocol — Core Runtime Entry Point
 * Main exports for the AFI-Core module
 */

// DAG exports
export * from './dags/index.js';

// Schema exports
export * from './schemas/index.js';

// Validator exports
export * from './validators/index.js';

// Core services
export { LifecycleManager } from './src/core/LifecycleManager.js';
export { VaultService } from './src/core/VaultService.js';
