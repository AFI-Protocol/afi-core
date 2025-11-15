export interface ExtensionResult {
    composite: number;
    breakdown: {
        poi: number;
        insight: number;
        confidence: number;
    };
}
export declare abstract class ValidatorExtension {
    abstract name: string;
    abstract description: string;
    abstract evaluate(signal: any): ExtensionResult;
    protected normalizeScore(score: number): number;
}
export declare function registerExtension(extension: ValidatorExtension): void;
export declare function getLoadedExtensions(): ValidatorExtension[];
export declare function clearExtensions(): void;
/**
 * Load validator extensions dynamically
 */
export declare function loadValidatorExtensions(): Promise<ValidatorExtension[]>;
/**
 * Get extensions filtered by market type
 */
export declare function getExtensionsForMarketType(marketType: string): Promise<ValidatorExtension[]>;
export { ValidatorExtension as default };
//# sourceMappingURL=ValidatorExtension.d.ts.map