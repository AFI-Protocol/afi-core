export interface CodexEntry {
    signalId: string;
    timestamp: string;
    validator: string;
    score: number;
    marketType: string;
    symbol?: string;
    meta: {
        extensions: any[];
        decayStage: string;
        lifecycleStage: string;
        [key: string]: any;
    };
}
/**
 * Log validation result to codex registry
 */
export declare function logToCodex(signal: any, result: any): void;
/**
 * Get codex entries for analysis
 */
export declare function getCodexEntries(): CodexEntry[];
/**
 * Generate unique signal ID
 */
export declare function generateSignalId(): string;
/**
 * Get codex statistics
 */
export declare function getCodexStats(): {
    totalSignals: number;
    lastUpdated: string | null;
};
//# sourceMappingURL=logCodex.d.ts.map