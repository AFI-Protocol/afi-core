/**
 * PoIValidator – advanced sample validator
 * ----------------------------------------
 * Evaluates a SignalPayload and produces:
 *  • insightScore  (0‑100)
 *  • confidence    (0‑1)
 *  • tags[]        (derived risk / sentiment tags)
 *
 * This is MVP logic – replace with ML / on‑chain calls later.
 */

// Minimal type definition (runtime/types.ts doesn't exist yet)
export interface SignalPayload {
  signalId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface PoIResult {
  insightScore: number;
  confidence: number;
  derivedTags: string[];
  notes?: string;
}

export class PoIValidator {
  static evaluate(signal: SignalPayload): PoIResult {
    // very naive heuristics for demo purposes
    const lengthFactor = Math.min(signal.content.length / 280, 1);   // tweet‑sized bias
    const hasNumbers  = /\d/.test(signal.content) ? 1 : 0.6;
    const sentiment   = /risk|alert|warning/i.test(signal.content) ? 'risk' : 'macro';

    const insightScore = Math.round(100 * lengthFactor * hasNumbers);
    const confidence   = Number((0.4 + 0.6 * lengthFactor).toFixed(2));

    return {
      insightScore,
      confidence,
      derivedTags: [sentiment],
      notes: `LengthFactor=${lengthFactor.toFixed(2)}, numeric=${!!hasNumbers}`
    };
  }
}
