import { z } from "zod";
export const ValidatorGovernanceSchema = z.object({
    validatorId: z.string().uuid(),
    proposalsSubmitted: z.number().int().nonnegative(),
    proposalsApproved: z.number().int().nonnegative(),
    activeVotes: z.number().int().nonnegative(),
    jailed: z.boolean(),
    governanceRole: z.enum(["observer", "participant", "moderator", "admin"]),
    lastParticipationDate: z.string(), // ISO date
});
//# sourceMappingURL=validator_governance_schema.js.map