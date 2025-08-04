export * from './logCodex.js';
/**
 * Format timestamp to ISO string
 */
export declare function formatTimestamp(timestamp?: string | number): string;
/**
 * Calculate signal age in milliseconds
 */
export declare function calculateSignalAge(timestamp: string | number): number;
/**
 * Validate signal structure
 */
export declare function validateSignalStructure(signal: any): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map