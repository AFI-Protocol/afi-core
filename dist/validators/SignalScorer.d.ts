import { z } from 'zod';
import { SignalSchema } from '../schemas/universal_signal_schema';
export interface SignalScoreResult {
    insightScore: number;
    confidence: number;
}
export declare class SignalScorer {
    static evaluate(signal: z.infer<typeof SignalSchema>): SignalScoreResult;
}
//# sourceMappingURL=SignalScorer.d.ts.map