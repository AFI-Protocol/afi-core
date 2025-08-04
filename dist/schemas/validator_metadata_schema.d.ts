import { z } from "zod";
export declare const ValidatorMetadataSchema: z.ZodObject<{
    validatorId: z.ZodString;
    name: z.ZodString;
    agentVersion: z.ZodString;
    contact: z.ZodOptional<z.ZodString>;
    poiScore: z.ZodNumber;
    stakeWeight: z.ZodNumber;
    reputationScore: z.ZodNumber;
    lastEpochActivity: z.ZodString;
    verified: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    validatorId: string;
    agentVersion: string;
    poiScore: number;
    stakeWeight: number;
    reputationScore: number;
    lastEpochActivity: string;
    verified: boolean;
    notes?: string | undefined;
    contact?: string | undefined;
}, {
    name: string;
    validatorId: string;
    agentVersion: string;
    poiScore: number;
    stakeWeight: number;
    reputationScore: number;
    lastEpochActivity: string;
    notes?: string | undefined;
    contact?: string | undefined;
    verified?: boolean | undefined;
}>;
export type ValidatorMetadata = z.infer<typeof ValidatorMetadataSchema>;
//# sourceMappingURL=validator_metadata_schema.d.ts.map