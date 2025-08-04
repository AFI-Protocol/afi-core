// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Extension Loader Utility           ┃
// ┃ Role: Ensure extensions are loaded before use     ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { loadValidatorExtensions, getLoadedExtensions } from './ValidatorExtension.js';
let extensionsLoaded = false;
let loadingPromise = null;
/**
 * Ensure extensions are loaded (singleton pattern)
 */
export async function ensureExtensionsLoaded() {
    if (extensionsLoaded) {
        return getLoadedExtensions();
    }
    if (loadingPromise) {
        return await loadingPromise;
    }
    loadingPromise = loadValidatorExtensions();
    const extensions = await loadingPromise;
    extensionsLoaded = true;
    loadingPromise = null;
    return extensions;
}
/**
 * Get extensions synchronously (returns empty array if not loaded)
 */
export function getExtensionsSync() {
    return getLoadedExtensions();
}
/**
 * Check if extensions are loaded
 */
export function areExtensionsLoaded() {
    return extensionsLoaded && getLoadedExtensions().length > 0;
}
/**
 * Reset extension loader state (useful for testing)
 */
export function resetExtensionLoader() {
    extensionsLoaded = false;
    loadingPromise = null;
}
//# sourceMappingURL=ExtensionLoader.js.map