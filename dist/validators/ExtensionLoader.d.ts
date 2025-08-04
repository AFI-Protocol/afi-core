import { ValidatorExtension } from './ValidatorExtension.js';
/**
 * Ensure extensions are loaded (singleton pattern)
 */
export declare function ensureExtensionsLoaded(): Promise<ValidatorExtension[]>;
/**
 * Get extensions synchronously (returns empty array if not loaded)
 */
export declare function getExtensionsSync(): ValidatorExtension[];
/**
 * Check if extensions are loaded
 */
export declare function areExtensionsLoaded(): boolean;
/**
 * Reset extension loader state (useful for testing)
 */
export declare function resetExtensionLoader(): void;
//# sourceMappingURL=ExtensionLoader.d.ts.map