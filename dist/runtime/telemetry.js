export class TelemetryCollector {
    events = [];
    maxEvents = 1000;
    emit(type, data, source = 'afi-core') {
        const event = {
            type,
            timestamp: Date.now(),
            data,
            source
        };
        this.events.push(event);
        // Keep only recent events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
        console.log(`[TELEMETRY] ${type}:`, data);
    }
    getEvents(type) {
        return type
            ? this.events.filter(e => e.type === type)
            : [...this.events];
    }
    clear() {
        this.events = [];
    }
}
export const telemetry = new TelemetryCollector();
//# sourceMappingURL=telemetry.js.map