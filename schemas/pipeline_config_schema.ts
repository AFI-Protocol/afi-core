import { z } from "zod";

/* ---------- SCHEMA ---------- */
export const PipelineConfigSchema = z.object({
  enabled: z.boolean().default(true),
  providers: z.array(z.string()).optional(),
  symbols: z.array(z.string()).optional(),
  engines: z.array(z.string()).optional(),
  timeframes: z.array(z.string()).optional(),
  scoreThreshold: z.number().min(0).max(100).optional(),
  maxOpenSignals: z.number().min(1).optional(),
  realtimeTransport: z
    .object({
      transport: z.enum(["ably", "socketio"]),
      ably: z
        .object({
          key: z.string().optional(),
          channel: z.string().optional(),
        })
        .optional(),
      socketio: z
        .object({
          namespace: z.string().default("/pipeline"),
          path: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

/* ---------- RUNTIME TYPE ---------- */
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

/* ---------- EVENT INTERFACES ---------- */
export interface ServerToClientEvents {
  config_update: (cfg: PipelineConfig) => void;
}

export interface ClientToServerEvents {
  set_config: (partial: Partial<PipelineConfig>, ack: (ok: boolean) => void) => void;
}
