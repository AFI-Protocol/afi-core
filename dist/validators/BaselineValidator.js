// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Baseline Validator          ┃
// ┃ Role: Core scoring logic for market signals┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
import { logToCodex, generateSignalId } from '../utils/index.js';
import { CryptoMomentum } from './modules/CryptoMomentum.js';
import { EquitySentiment } from './modules/EquitySentiment.js';
import { LifecycleManager } from '../src/core/LifecycleManager.js';
import { VaultService } from '../src/core/VaultService.js';
export class BaselineValidator {
    static evaluate(signal) {
        return { score: 1, notes: 'Baseline validator stub evaluation' };
    }
    /**
     * Score a signal with comprehensive validation (synchronous version)
     */
    static score(signal, shouldVault = true) {
        const symbol = signal?.symbol || 'UNKNOWN';
        const content = signal?.content || signal?.notes || '';
        // Determine market type first
        const marketType = BaselineValidator.determineMarketType(symbol, content);
        // Calculate PoI score (0-100)
        const poi = BaselineValidator.calculatePoI(content, marketType);
        // Calculate Insight score (0-100)  
        const insight = BaselineValidator.calculateInsight(content, symbol);
        // Calculate confidence (0-100)
        const confidence = BaselineValidator.calculateConfidence(content, marketType);
        // Composite score: PoI*0.6 + Insight*0.4
        let composite = Math.round(poi * 0.6 + insight * 0.4);
        // Apply synchronous extensions (fallback for immediate scoring)
        const syncExtensions = BaselineValidator.getSyncExtensionsForMarketType(marketType);
        const extensionResults = syncExtensions.map(ext => {
            const result = ext.evaluate(signal);
            return {
                name: ext.name,
                composite: result.composite ?? 0,
                breakdown: result.breakdown ?? { poi: 0, insight: 0, confidence: 0 },
                score: result.composite ?? 0,
                metadata: {}
            };
        });
        // Apply extension adjustments to composite score
        extensionResults.forEach(extResult => {
            if (extResult.composite > 0) {
                composite = Math.min(100, composite + Math.round(extResult.composite * 0.1));
            }
        });
        // Ensure composite stays within bounds
        composite = Math.max(0, Math.min(100, composite));
        // Generate comprehensive metadata
        const signalId = signal?.id || generateSignalId();
        const timestamp = new Date().toISOString();
        const decayStage = BaselineValidator.determineDecayStage(signal);
        let metadata = {
            signalId,
            timestamp,
            validator: 'BaselineValidator',
            finalComposite: composite,
            marketType,
            decayStage,
            symbol: signal?.symbol ?? undefined,
            extensions: extensionResults,
            lifecycleStage: 'new',
            stageTransition: { from: 'unknown', to: 'new' },
            // Add core metadata fields
            ageInMs: 0,
            stageTransitions: []
        };
        // Convert to core metadata format for lifecycle management
        const coreMetadata = {
            signalId: metadata.signalId,
            lifecycleStage: metadata.lifecycleStage,
            finalComposite: metadata.finalComposite,
            timestamp: metadata.timestamp,
            ageInMs: metadata.ageInMs,
            stageTransitions: metadata.stageTransitions
        };
        // 🔄 LIFECYCLE ORCHESTRATION
        const updatedCoreMetadata = LifecycleManager.updateLifecycle(signal, coreMetadata);
        // Update our metadata with lifecycle results
        metadata.lifecycleStage = updatedCoreMetadata.lifecycleStage;
        metadata.ageInMs = updatedCoreMetadata.ageInMs;
        metadata.stageTransitions = updatedCoreMetadata.stageTransitions;
        // 🏦 VAULT MATURE SIGNALS (only if shouldVault is true)
        if (shouldVault && LifecycleManager.shouldVault(updatedCoreMetadata)) {
            VaultService.vaultSignal(signal, metadata);
            VaultService.simulateChallenge(signalId);
        }
        const result = {
            score: composite,
            composite: composite,
            breakdown: { poi, insight, confidence },
            metadata
        };
        // Log to codex
        console.log(`[BaselineValidator] Signal ${signalId} scored: ${composite}`);
        logToCodex(signal, metadata);
        return result;
    }
    /**
     * Async version of score with dynamic extension loading
     */
    static async scoreAsync(signal, shouldVault = true) {
        const symbol = signal?.symbol || 'UNKNOWN';
        const content = signal?.content || signal?.notes || '';
        // Determine market type first
        const marketType = BaselineValidator.determineMarketType(symbol, content);
        // Calculate base scores (0-100)
        const poi = BaselineValidator.calculatePoI(content, marketType);
        const insight = BaselineValidator.calculateInsight(content, symbol);
        const confidence = BaselineValidator.calculateConfidence(content, marketType);
        // Composite score: PoI*0.6 + Insight*0.4
        let composite = Math.round(poi * 0.6 + insight * 0.4);
        // 🔄 Load extensions dynamically
        const extensions = await BaselineValidator.getExtensionsForMarketType(marketType);
        const extensionResults = extensions.map(ext => {
            const result = ext.evaluate(signal);
            return {
                name: ext.name,
                composite: result.composite ?? 0,
                breakdown: result.breakdown ?? { poi: 0, insight: 0, confidence: 0 },
                score: result.composite ?? 0,
                metadata: {}
            };
        });
        // Apply extension adjustments to composite score
        extensionResults.forEach(extResult => {
            if (extResult.composite > 0) {
                composite = Math.min(100, composite + Math.round(extResult.composite * 0.1));
            }
        });
        // Ensure composite stays within bounds
        composite = Math.max(0, Math.min(100, composite));
        // Generate comprehensive metadata
        const signalId = signal?.id || generateSignalId();
        const timestamp = new Date().toISOString();
        const decayStage = BaselineValidator.determineDecayStage(signal);
        let metadata = {
            signalId,
            timestamp,
            validator: 'BaselineValidator',
            finalComposite: composite,
            marketType,
            decayStage,
            symbol: signal?.symbol ?? undefined,
            extensions: extensionResults,
            lifecycleStage: 'new',
            stageTransition: { from: 'unknown', to: 'new' },
            // Add core metadata fields
            ageInMs: 0,
            stageTransitions: []
        };
        // Convert to core metadata format for lifecycle management
        const coreMetadata = {
            signalId: metadata.signalId,
            lifecycleStage: metadata.lifecycleStage,
            finalComposite: metadata.finalComposite,
            timestamp: metadata.timestamp,
            ageInMs: metadata.ageInMs,
            stageTransitions: metadata.stageTransitions
        };
        // 🔄 LIFECYCLE ORCHESTRATION
        const updatedCoreMetadata = LifecycleManager.updateLifecycle(signal, coreMetadata);
        // Update our metadata with lifecycle results
        metadata.lifecycleStage = updatedCoreMetadata.lifecycleStage;
        metadata.ageInMs = updatedCoreMetadata.ageInMs;
        metadata.stageTransitions = updatedCoreMetadata.stageTransitions;
        // 🏦 VAULT MATURE SIGNALS (only if shouldVault is true)
        if (shouldVault && LifecycleManager.shouldVault(updatedCoreMetadata)) {
            VaultService.vaultSignal(signal, metadata);
            VaultService.simulateChallenge(signalId);
        }
        const result = {
            score: composite,
            composite: composite,
            breakdown: { poi, insight, confidence },
            metadata
        };
        // Log to codex
        console.log(`[BaselineValidator] Signal ${signalId} scored: ${composite} (async)`);
        logToCodex(signal, metadata);
        return result;
    }
    /**
     * Async version of validateSignal for dynamic extension loading
     */
    static async validateSignalAsync(signal, shouldVault = true) {
        // Delegate to scoreAsync for consistency
        return await BaselineValidator.scoreAsync(signal, shouldVault);
    }
    /**
     * Dynamic extension selection based on market type
     */
    static async getExtensionsForMarketType(marketType) {
        const { getExtensionsForMarketType } = await import('./ValidatorExtension.js');
        return await getExtensionsForMarketType(marketType);
    }
    /**
     * Get synchronous extensions for immediate scoring (fallback)
     */
    static getSyncExtensionsForMarketType(marketType) {
        // Use pre-loaded extensions or fallback instances
        try {
            const { getLoadedExtensions } = require('./ValidatorExtension.js');
            const loadedExtensions = getLoadedExtensions();
            if (loadedExtensions.length === 0) {
                // Fallback to direct imports if registry is empty
                return marketType === 'crypto'
                    ? [new CryptoMomentum()]
                    : [new EquitySentiment()];
            }
            return loadedExtensions.filter((ext) => {
                if (marketType === 'crypto')
                    return ext.name === 'CryptoMomentum';
                if (marketType === 'equity')
                    return ext.name === 'EquitySentiment';
                return true; // Default: include all extensions
            });
        }
        catch (error) {
            // Fallback if ValidatorExtension module fails
            return marketType === 'crypto'
                ? [new CryptoMomentum()]
                : [new EquitySentiment()];
        }
    }
    /**
     * Filter extensions by market type
     */
    static filterExtensionsByMarketType(extensions, marketType) {
        const coreExtensions = extensions.filter(ext => ext.name === 'DecayExtension' || ext.name === 'GreeksExtension');
        switch (marketType) {
            case 'crypto':
                const cryptoExt = extensions.find(ext => ext.name === 'CryptoMomentum');
                return cryptoExt ? [...coreExtensions, cryptoExt] : coreExtensions;
            case 'stock':
                const equityExt = extensions.find(ext => ext.name === 'EquitySentiment');
                return equityExt ? [...coreExtensions, equityExt] : coreExtensions;
            default:
                return coreExtensions;
        }
    }
    /**
     * Generate comprehensive metadata for the signal
     */
    static generateMetadata(signal, extensions, finalComposite) {
        const timestamp = new Date().toISOString();
        // Use LifecycleManager for proper stage determination
        const { LifecycleManager } = require('../runtime/lifecycle_manager.js');
        const decayStage = BaselineValidator.determineDecayStage(signal);
        const lifecycleStage = LifecycleManager.determineStage(signal, decayStage);
        // Convert extensions to ValidatorExtensionResult format
        const extensionResults = extensions.map(ext => ({
            name: ext.name,
            composite: 0, // Default values since this is metadata generation
            breakdown: { poi: 0, insight: 0, confidence: 0 },
            score: 0,
            metadata: {}
        }));
        return {
            signalId: signal.id || `signal_${Date.now()}`,
            timestamp,
            validator: 'BaselineValidator',
            finalComposite,
            marketType: BaselineValidator.determineMarketType(signal?.symbol || '', signal?.content || ''),
            extensions: extensionResults,
            decayStage,
            symbol: signal?.symbol,
            lifecycleStage,
            stageTransition: { from: 'unknown', to: lifecycleStage },
            // Add core metadata fields
            ageInMs: 0,
            stageTransitions: []
        };
    }
    /**
     * Determine market type based on symbol and content
     */
    static determineMarketType(symbol, content) {
        const symbolUpper = symbol.toUpperCase();
        const contentLower = content.toLowerCase();
        // Crypto indicators - enhanced detection
        // 1. Symbols ending in -USD or /USD
        if (symbolUpper.endsWith('-USD') || symbolUpper.endsWith('/USD')) {
            return 'crypto';
        }
        // 2. Known crypto tickers
        const cryptoTickers = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI'];
        if (cryptoTickers.some(ticker => symbolUpper.includes(ticker))) {
            return 'crypto';
        }
        // 3. USDT pairs
        if (symbolUpper.includes('USDT') || symbolUpper.includes('-USDT') || symbolUpper.includes('/USDT')) {
            return 'crypto';
        }
        // 4. Content-based crypto detection
        if (contentLower.includes('crypto') || contentLower.includes('bitcoin') ||
            contentLower.includes('ethereum') || contentLower.includes('blockchain')) {
            return 'crypto';
        }
        // Stock indicators - stricter detection
        // 1. 2-5 capital letters, excluding crypto-related terms
        if (symbolUpper.match(/^[A-Z]{2,5}$/) &&
            !symbolUpper.includes('USD') &&
            !symbolUpper.includes('USDT') &&
            !cryptoTickers.includes(symbolUpper)) {
            return 'stock';
        }
        // 2. Content-based stock detection
        if (contentLower.includes('stock') || contentLower.includes('equity') ||
            contentLower.includes('shares') || contentLower.includes('earnings')) {
            return 'stock';
        }
        return 'unknown';
    }
    /**
     * Determine decay stage based on signal age
     */
    static determineDecayStage(signal) {
        const timestamp = signal?.timestamp || new Date().toISOString();
        const signalAge = Date.now() - new Date(timestamp).getTime();
        const ageInHours = signalAge / (1000 * 60 * 60);
        if (ageInHours < 0.5)
            return 'fresh'; // < 30 minutes
        if (ageInHours < 4)
            return 'live'; // < 4 hours
        if (ageInHours < 24)
            return 'mature'; // < 24 hours
        if (ageInHours < 168)
            return 'decay'; // < 1 week
        return 'expired'; // > 1 week
    }
    static calculatePoI(content, marketType) {
        let poi = Math.min(content.length / 2.8, 100);
        // Market-specific PoI adjustments
        if (marketType === 'crypto') {
            if (/breakout|pump|surge|moon/i.test(content))
                poi *= 1.2;
            if (/volume|momentum/i.test(content))
                poi *= 1.1;
        }
        else if (marketType === 'stock') {
            if (/earnings|revenue|growth/i.test(content))
                poi *= 1.15;
            if (/upgrade|downgrade|analyst/i.test(content))
                poi *= 1.1;
        }
        return Math.min(Math.round(poi), 100);
    }
    static calculateInsight(content, symbol) {
        let insight = Math.min(content.length / 3.5, 100);
        // Symbol-specific adjustments
        if (symbol && symbol.length > 0) {
            insight *= 1.1;
        }
        // Content quality indicators
        if (/analysis|technical|fundamental/i.test(content))
            insight *= 1.2;
        if (/target|price|level/i.test(content))
            insight *= 1.15;
        return Math.min(Math.round(insight), 100);
    }
    static calculateConfidence(content, marketType) {
        let confidence = Math.min(content.length / 4, 100);
        // Market-specific confidence adjustments
        if (marketType === 'crypto') {
            if (/volatility|risk/i.test(content))
                confidence *= 0.9;
        }
        else if (marketType === 'stock') {
            if (/fundamentals|earnings/i.test(content))
                confidence *= 1.1;
        }
        return Math.min(Math.round(confidence), 100);
    }
    /**
     * Smart scoring method that uses async if extensions are not loaded
     */
    static async smartScore(signal, shouldVault = true) {
        const { areExtensionsLoaded } = await import('./ExtensionLoader.js');
        if (areExtensionsLoaded()) {
            // Extensions are loaded, use synchronous version
            return BaselineValidator.score(signal, shouldVault);
        }
        else {
            // Extensions not loaded, use async version
            return await BaselineValidator.scoreAsync(signal, shouldVault);
        }
    }
}
//# sourceMappingURL=BaselineValidator.js.map