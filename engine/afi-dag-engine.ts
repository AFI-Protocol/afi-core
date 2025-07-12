// 🔧 AFI DAG Execution Engine (Stub)

export type DagExecutionMode = 'chained' | 'parallel' | 'conditional' | 'template';

export interface DagNode {
  id: string;
  label: string;
  inputKeys: string[];
  outputKeys: string[];
  executionMode: DagExecutionMode;
  execute: (signal: any) => Promise<any>;
}

// TODO: Build full DAG orchestration logic post-schema finalization.