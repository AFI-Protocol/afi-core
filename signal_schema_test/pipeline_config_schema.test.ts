import { describe, it, expect } from "vitest";
import { PipelineConfigSchema } from "../schemas/pipeline_config_schema";

describe("pipeline_config_schema", () => {
  it("accepts a valid pipeline config example", () => {
    const config = {
      enabled: true,
      providers: ["tradingview"],
      symbols: ["BTCUSDT", "ETHUSDT"],
      engines: ["pine"],
      timeframes: ["1h", "4h"],
      scoreThreshold: 80,
      maxOpenSignals: 5,
      realtimeTransport: {
        transport: "socketio",
        socketio: {
          namespace: "/pipeline",
        },
      },
    };

    const parsed = PipelineConfigSchema.safeParse(config);
    console.log("Validation result:", parsed);
    expect(parsed.success).toBe(true);
  });
});
