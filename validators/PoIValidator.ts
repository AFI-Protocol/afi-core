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
import { SignalSchema } from '../schemas/universal_signal_schema';

export interface PoIResult {
  insightScore: number;
  confidence: number;
  derivedTags: string[];
  notes?: string;
}

const MAX_TWEET_LENGTH = 280;
const BASE_CONFIDENCE = 0.4;
const CONFIDENCE_MULTIPLIER = 0.6;

export class PoIValidator {
  static evaluate(signal: z.infer<typeof SignalSchema>): PoIResult {
    const lengthFactor = PoIValidator.calculateLengthFactor(signal.content.length);
    const hasNumbers = PoIValidator.containsNumbers(signal.content);
    const sentiment = PoIValidator.determineSentiment(signal.content);

    const insightScore = PoIValidator.calculateInsightScore(lengthFactor, hasNumbers);
    const confidence = PoIValidator.calculateConfidence(lengthFactor);

    return {
      insightScore,
      confidence,
      derivedTags: [sentiment],
      notes: `LengthFactor=${lengthFactor.toFixed(2)}, numeric=${!!hasNumbers}`
    };
  }

  private static calculateLengthFactor(contentLength: number): number {
    return Math.min(contentLength / MAX_TWEET_LENGTH, 1);
  }

  private static containsNumbers(content: string): number {
    return /\d/.test(content) ? 1 : 0.6;
  }

  private static determineSentiment(content: string): string {
    return /risk|alert|warning/i.test(content) ? 'risk' : 'macro';
  }

  private static calculateInsightScore(lengthFactor: number, hasNumbers: number): number {
    return Math.round(100 * lengthFactor * hasNumbers);
  }

  private static calculateConfidence(lengthFactor: number): number {
    return Number((BASE_CONFIDENCE + CONFIDENCE_MULTIPLIER * lengthFactor).toFixed(2));
  }
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
