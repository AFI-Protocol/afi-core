/**
 * Decay module exports
 *
 * This module provides Greeks-style time decay templates and utilities
 * for AFI Protocol signal scoring.
 */

export {
  type GreeksDecayTemplate,
  type HoldingHorizon,
  type DecayModel,
  type DecayParams,
  GreeksDecayTemplateSchema,
  DEFAULT_DECAY_TEMPLATES_BY_HORIZON,
  pickDecayParamsForAnalystScore,
  applyTimeDecay,
} from "./GreeksDecayTemplate.js";

