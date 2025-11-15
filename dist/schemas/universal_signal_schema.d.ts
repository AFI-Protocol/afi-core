import { z } from "zod";
export declare const SignalSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    market: z.ZodOptional<z.ZodString>;
    action: z.ZodEnum<["buy", "sell", "hold"]>;
    price: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    source: z.ZodOptional<z.ZodString>;
    strategy: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    targetPrice: z.ZodOptional<z.ZodNumber>;
    stopLoss: z.ZodOptional<z.ZodNumber>;
    timeframe: z.ZodOptional<z.ZodString>;
    strength: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    content: z.ZodString;
    indicators: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
        timeframe: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean | null;
        name: string;
        timeframe?: string | undefined;
    }, {
        value: string | number | boolean | null;
        name: string;
        timeframe?: string | undefined;
    }>, "many">>;
    analysis: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        result: z.ZodString;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        result: string;
        confidence?: number | undefined;
    }, {
        type: string;
        result: string;
        confidence?: number | undefined;
    }>, "many">>;
    subscribed: z.ZodOptional<z.ZodBoolean>;
    score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    action: "buy" | "sell" | "hold";
    content: string;
    id?: string | undefined;
    market?: string | undefined;
    price?: number | undefined;
    timestamp?: string | number | undefined;
    source?: string | undefined;
    strategy?: string | undefined;
    notes?: string | undefined;
    targetPrice?: number | undefined;
    stopLoss?: number | undefined;
    timeframe?: string | undefined;
    strength?: "low" | "medium" | "high" | undefined;
    indicators?: {
        value: string | number | boolean | null;
        name: string;
        timeframe?: string | undefined;
    }[] | undefined;
    analysis?: {
        type: string;
        result: string;
        confidence?: number | undefined;
    }[] | undefined;
    subscribed?: boolean | undefined;
    score?: number | undefined;
}, {
    symbol: string;
    action: "buy" | "sell" | "hold";
    content: string;
    id?: string | undefined;
    market?: string | undefined;
    price?: number | undefined;
    timestamp?: string | number | undefined;
    source?: string | undefined;
    strategy?: string | undefined;
    notes?: string | undefined;
    targetPrice?: number | undefined;
    stopLoss?: number | undefined;
    timeframe?: string | undefined;
    strength?: "low" | "medium" | "high" | undefined;
    indicators?: {
        value: string | number | boolean | null;
        name: string;
        timeframe?: string | undefined;
    }[] | undefined;
    analysis?: {
        type: string;
        result: string;
        confidence?: number | undefined;
    }[] | undefined;
    subscribed?: boolean | undefined;
    score?: number | undefined;
}>;
//# sourceMappingURL=universal_signal_schema.d.ts.map