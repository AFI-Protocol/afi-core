// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — ValidatorExtension Base Class      ┃
// ┃ Foundation for all signal validation extensions   ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export class ValidatorExtension {
    // Helper method for consistent scoring
    normalizeScore(score) {
        return Math.max(0, Math.min(100, score));
    }
}
// Global extension registry
const loadedExtensions = [];
export function registerExtension(extension) {
    loadedExtensions.push(extension);
}
export function getLoadedExtensions() {
    return loadedExtensions;
}
export function clearExtensions() {
    loadedExtensions.length = 0;
}
/**
 * Load validator extensions dynamically
 */
export async function loadValidatorExtensions() {
    try {
        // Clear existing extensions
        clearExtensions();
        // Import and register built-in extensions
        const { CryptoMomentum } = await import('./modules/CryptoMomentum.js');
        const { EquitySentiment } = await import('./modules/EquitySentiment.js');
        const { DecayExtension } = await import('./extensions/DecayExtension.js');
        const { GreeksExtension } = await import('./extensions/GreeksExtension.js');
        // Register extensions
        registerExtension(new CryptoMomentum());
        registerExtension(new EquitySentiment());
        registerExtension(new DecayExtension());
        registerExtension(new GreeksExtension());
        return getLoadedExtensions();
    }
    catch (error) {
        console.warn('[ValidatorExtension] Failed to load extensions:', error);
        return [];
    }
}
/**
 * Get extensions filtered by market type
 */
export async function getExtensionsForMarketType(marketType) {
    const extensions = await loadValidatorExtensions();
    // Core extensions that apply to all market types
    const coreExtensions = extensions.filter(ext => ext.name === 'DecayExtension' || ext.name === 'GreeksExtension');
    // Market-specific extensions
    switch (marketType) {
        case 'crypto':
            const cryptoExt = extensions.find(ext => ext.name === 'CryptoMomentum');
            return cryptoExt ? [...coreExtensions, cryptoExt] : coreExtensions;
        case 'stock':
        case 'equity':
            const equityExt = extensions.find(ext => ext.name === 'EquitySentiment');
            return equityExt ? [...coreExtensions, equityExt] : coreExtensions;
        default:
            return coreExtensions;
    }
}
// Auto-register built-in extensions on module load
try {
    // Use dynamic imports to avoid circular dependencies
    Promise.all([
        import('./modules/CryptoMomentum.js'),
        import('./modules/EquitySentiment.js')
    ]).then(([cryptoModule, equityModule]) => {
        registerExtension(new cryptoModule.CryptoMomentum());
        registerExtension(new equityModule.EquitySentiment());
    }).catch(error => {
        console.warn('[ValidatorExtension] Failed to auto-register extensions:', error);
    });
}
catch (error) {
    console.warn('[ValidatorExtension] Failed to auto-register extensions:', error);
}
export { ValidatorExtension as default };
//# sourceMappingURL=ValidatorExtension.js.map