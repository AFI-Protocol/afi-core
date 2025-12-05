import { z } from "zod";

/**
 * Validator Metadata v0.1 (afi-core)
 *
 * - Lightweight view for registry/UI use.
 * - PoI and PoInsight are validator-level traits only; they do NOT appear on signals.
 * - This metadata cannot override UWR or TSSD vault finality.
 * - Evolving text spec lives in:
 *   - afi-infra/agent-roles/validator_metadata_v1.md
 *   - afi-config/docs/REGISTRIES_AND_REPUTATION.v0.1.md
 * - Future versions should extend with optional fields rather than rename required ones.
 */

export const ValidatorMetadataSchema = z.object({
  validatorId: z.string().uuid(),
  name: z.string(),
  agentVersion: z.string(),
  contact: z.string().email().optional(),
  poiScore: z.number().min(0).max(1),
  stakeWeight: z.number().nonnegative(),
  reputationScore: z.number().min(0).max(100),
  lastEpochActivity: z.string(), // ISO date
  verified: z.boolean().default(false),
  notes: z.string().optional()
});

export type ValidatorMetadata = z.infer<typeof ValidatorMetadataSchema>;
