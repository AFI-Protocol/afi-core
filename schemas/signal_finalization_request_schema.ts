import { z } from "zod";

/**
 * Signal Finalization Request (v0.1)
 *
 * Request payload for finalizing a signal. Metrics here are operational telemetry
 * (latency, compute, accuracy, reliability) and do NOT override UWR outputs or
 * TSSD vault finality.
 */
export const SignalFinalizationRequestSchema = z.object({
  signalId: z.string().uuid(),
  validatorId: z.string().uuid(),
  timestamp: z.string(), // ISO format
  finalScore: z.number().min(0).max(1),
  scoringNotes: z.string().optional(),
  confidenceLevel: z.number().min(0).max(1),
  runtimeMetrics: z.object({
    latencyMs: z.number().nonnegative(),
    computeTimeMs: z.number().nonnegative(),
    accuracyEstimate: z.number().min(0).max(1),
    reliabilityScore: z.number().min(0).max(1)
  }),
  signature: z.string()
});

export type SignalFinalizationRequest = z.infer<typeof SignalFinalizationRequestSchema>;
