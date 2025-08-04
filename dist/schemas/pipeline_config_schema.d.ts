import { z } from "zod";
export declare const PipelineConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    symbols: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    engines: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeframes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    scoreThreshold: z.ZodOptional<z.ZodNumber>;
    maxOpenSignals: z.ZodOptional<z.ZodNumber>;
    realtimeTransport: z.ZodOptional<z.ZodObject<{
        transport: z.ZodEnum<["ably", "socketio"]>;
        ably: z.ZodOptional<z.ZodObject<{
            key: z.ZodOptional<z.ZodString>;
            channel: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            key?: string | undefined;
            channel?: string | undefined;
        }, {
            key?: string | undefined;
            channel?: string | undefined;
        }>>;
        socketio: z.ZodOptional<z.ZodObject<{
            namespace: z.ZodDefault<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            namespace: string;
            path?: string | undefined;
        }, {
            path?: string | undefined;
            namespace?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        transport: "ably" | "socketio";
        ably?: {
            key?: string | undefined;
            channel?: string | undefined;
        } | undefined;
        socketio?: {
            namespace: string;
            path?: string | undefined;
        } | undefined;
    }, {
        transport: "ably" | "socketio";
        ably?: {
            key?: string | undefined;
            channel?: string | undefined;
        } | undefined;
        socketio?: {
            path?: string | undefined;
            namespace?: string | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    providers?: string[] | undefined;
    symbols?: string[] | undefined;
    engines?: string[] | undefined;
    timeframes?: string[] | undefined;
    scoreThreshold?: number | undefined;
    maxOpenSignals?: number | undefined;
    realtimeTransport?: {
        transport: "ably" | "socketio";
        ably?: {
            key?: string | undefined;
            channel?: string | undefined;
        } | undefined;
        socketio?: {
            namespace: string;
            path?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    enabled?: boolean | undefined;
    providers?: string[] | undefined;
    symbols?: string[] | undefined;
    engines?: string[] | undefined;
    timeframes?: string[] | undefined;
    scoreThreshold?: number | undefined;
    maxOpenSignals?: number | undefined;
    realtimeTransport?: {
        transport: "ably" | "socketio";
        ably?: {
            key?: string | undefined;
            channel?: string | undefined;
        } | undefined;
        socketio?: {
            path?: string | undefined;
            namespace?: string | undefined;
        } | undefined;
    } | undefined;
}>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export interface ServerToClientEvents {
    config_update: (cfg: PipelineConfig) => void;
}
export interface ClientToServerEvents {
    set_config: (partial: Partial<PipelineConfig>, ack: (ok: boolean) => void) => void;
}
//# sourceMappingURL=pipeline_config_schema.d.ts.map