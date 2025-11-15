import { z } from "zod";
export const SignalFinalizationRequestSchema = z.object({
    signalId: z.string().uuid(),
    validatorId: z.string().uuid(),
    timestamp: z.string(), // ISO format
    finalScore: z.number().min(0).max(1),
    scoringNotes: z.string().optional(),
    confidenceLevel: z.number().min(0).max(1),
    poiMetrics: z.object({
        latencyMs: z.number().nonnegative(),
        computeTimeMs: z.number().nonnegative(),
        accuracyEstimate: z.number().min(0).max(1),
        reliabilityScore: z.number().min(0).max(1)
    }),
    signature: z.string()
});
//# sourceMappingURL=signal_finalization_request_schema.js.map