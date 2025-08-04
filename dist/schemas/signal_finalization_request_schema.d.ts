import { z } from "zod";
export declare const SignalFinalizationRequestSchema: z.ZodObject<{
    signalId: z.ZodString;
    validatorId: z.ZodString;
    timestamp: z.ZodString;
    finalScore: z.ZodNumber;
    scoringNotes: z.ZodOptional<z.ZodString>;
    confidenceLevel: z.ZodNumber;
    poiMetrics: z.ZodObject<{
        latencyMs: z.ZodNumber;
        computeTimeMs: z.ZodNumber;
        accuracyEstimate: z.ZodNumber;
        reliabilityScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latencyMs: number;
        computeTimeMs: number;
        accuracyEstimate: number;
        reliabilityScore: number;
    }, {
        latencyMs: number;
        computeTimeMs: number;
        accuracyEstimate: number;
        reliabilityScore: number;
    }>;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    signalId: string;
    validatorId: string;
    finalScore: number;
    confidenceLevel: number;
    poiMetrics: {
        latencyMs: number;
        computeTimeMs: number;
        accuracyEstimate: number;
        reliabilityScore: number;
    };
    signature: string;
    scoringNotes?: string | undefined;
}, {
    timestamp: string;
    signalId: string;
    validatorId: string;
    finalScore: number;
    confidenceLevel: number;
    poiMetrics: {
        latencyMs: number;
        computeTimeMs: number;
        accuracyEstimate: number;
        reliabilityScore: number;
    };
    signature: string;
    scoringNotes?: string | undefined;
}>;
export type SignalFinalizationRequest = z.infer<typeof SignalFinalizationRequestSchema>;
//# sourceMappingURL=signal_finalization_request_schema.d.ts.map