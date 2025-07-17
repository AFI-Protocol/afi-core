import { z } from "zod";

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
