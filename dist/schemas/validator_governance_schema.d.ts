import { z } from "zod";
export declare const ValidatorGovernanceSchema: z.ZodObject<{
    validatorId: z.ZodString;
    proposalsSubmitted: z.ZodNumber;
    proposalsApproved: z.ZodNumber;
    activeVotes: z.ZodNumber;
    jailed: z.ZodBoolean;
    governanceRole: z.ZodEnum<["observer", "participant", "moderator", "admin"]>;
    lastParticipationDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    validatorId: string;
    proposalsSubmitted: number;
    proposalsApproved: number;
    activeVotes: number;
    jailed: boolean;
    governanceRole: "observer" | "participant" | "moderator" | "admin";
    lastParticipationDate: string;
}, {
    validatorId: string;
    proposalsSubmitted: number;
    proposalsApproved: number;
    activeVotes: number;
    jailed: boolean;
    governanceRole: "observer" | "participant" | "moderator" | "admin";
    lastParticipationDate: string;
}>;
export type ValidatorGovernance = z.infer<typeof ValidatorGovernanceSchema>;
//# sourceMappingURL=validator_governance_schema.d.ts.map