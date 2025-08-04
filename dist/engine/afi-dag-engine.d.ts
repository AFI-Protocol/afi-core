export type DagExecutionMode = 'chained' | 'parallel' | 'conditional' | 'template';
export interface DagNode {
    id: string;
    label: string;
    inputKeys: string[];
    outputKeys: string[];
    executionMode: DagExecutionMode;
    execute: (signal: any) => Promise<any>;
}
/**
 * Process a replayed signal from vault
 */
export declare function processReplayedSignal(signal: any): void;
//# sourceMappingURL=afi-dag-engine.d.ts.map