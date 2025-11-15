import { z } from 'zod';
import { SignalSchema } from '../schemas/universal_signal_schema.js';
import { ValidationResult, BaselineEvaluation } from './types.js';
export declare class BaselineValidator {
    static evaluate(signal: z.infer<typeof SignalSchema>): BaselineEvaluation;
    /**
     * Score a signal with comprehensive validation (synchronous version)
     */
    static score(signal: any, shouldVault?: boolean): ValidationResult;
    /**
     * Async version of score with dynamic extension loading
     */
    static scoreAsync(signal: any, shouldVault?: boolean): Promise<ValidationResult>;
    /**
     * Async version of validateSignal for dynamic extension loading
     */
    static validateSignalAsync(signal: z.infer<typeof SignalSchema>, shouldVault?: boolean): Promise<ValidationResult>;
    /**
     * Dynamic extension selection based on market type
     */
    private static getExtensionsForMarketType;
    /**
     * Get synchronous extensions for immediate scoring (fallback)
     */
    private static getSyncExtensionsForMarketType;
    /**
     * Filter extensions by market type
     */
    private static filterExtensionsByMarketType;
    /**
     * Generate comprehensive metadata for the signal
     */
    private static generateMetadata;
    /**
     * Determine market type based on symbol and content
     */
    static determineMarketType(symbol: string, content: string): string;
    /**
     * Determine decay stage based on signal age
     */
    static determineDecayStage(signal: any): string;
    private static calculatePoI;
    private static calculateInsight;
    private static calculateConfidence;
    /**
     * Smart scoring method that uses async if extensions are not loaded
     */
    static smartScore(signal: any, shouldVault?: boolean): Promise<ValidationResult>;
}
//# sourceMappingURL=BaselineValidator.d.ts.map