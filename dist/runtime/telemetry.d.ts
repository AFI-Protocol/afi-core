export interface TelemetryEvent {
    type: string;
    timestamp: number;
    data: Record<string, any>;
    source: string;
}
export declare class TelemetryCollector {
    private events;
    private maxEvents;
    emit(type: string, data: Record<string, any>, source?: string): void;
    getEvents(type?: string): TelemetryEvent[];
    clear(): void;
}
export declare const telemetry: TelemetryCollector;
//# sourceMappingURL=telemetry.d.ts.map