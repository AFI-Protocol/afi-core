import { z } from 'zod';
import { SignalSchema } from '../schemas/universal_signal_schema';

export interface SignalScoreResult {
  insightScore: number;
  confidence: number;
  derivedTags: string[];
  notes?: string;
}

const MAX_CONTENT_LENGTH = 280;
const BASE_CONFIDENCE = 0.4;
const CONFIDENCE_MULTIPLIER = 0.6;

export class SignalScorer {
  static evaluate(signal: z.infer<typeof SignalSchema>): SignalScoreResult {
    const lengthFactor = SignalScorer.calculateLengthFactor(signal.content.length);
    const hasNumbers = SignalScorer.containsNumbers(signal.content);
    const sentiment = SignalScorer.determineSentiment(signal.content);

    const insightScore = SignalScorer.calculateInsightScore(lengthFactor, hasNumbers);
    const confidence = SignalScorer.calculateConfidence(lengthFactor);

    return {
      insightScore,
      confidence,
      derivedTags: [sentiment],
      notes: `LengthFactor=${lengthFactor.toFixed(2)}, numeric=${!!hasNumbers}`
    };
  }

  private static calculateLengthFactor(contentLength: number): number {
    return Math.min(contentLength / MAX_CONTENT_LENGTH, 1);
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
}
