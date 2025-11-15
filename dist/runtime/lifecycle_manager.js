export class LifecycleManager {
    /**
     * Determine lifecycle stage based on signal age and decay stage
     */
    static determineStage(signal, decayStage) {
        const timestamp = signal?.timestamp || new Date().toISOString();
        const signalAge = Date.now() - new Date(timestamp).getTime();
        const ageInMinutes = signalAge / (1000 * 60);
        const ageInHours = signalAge / (1000 * 60 * 60);
        // Special case: Force mature for expired decay stage
        if (decayStage === 'expired') {
            return 'mature';
        }
        // If decay stage is provided, use it as a hint for other stages
        if (decayStage) {
            switch (decayStage) {
                case 'fresh':
                    return 'new';
                case 'live':
                    return 'live';
                case 'mature':
                    return 'mature';
                case 'decay':
                    return 'decaying';
                default:
                    break;
            }
        }
        // Age-based determination - return expected lifecycle stages
        if (ageInMinutes < 5) {
            return 'new'; // < 5 minutes
        }
        else if (ageInMinutes < 30) {
            return 'live'; // >= 5 min and < 30 min
        }
        else if (ageInHours < 24) {
            return 'decaying'; // >= 30 min and < 24 hours
        }
        else {
            return 'mature'; // >= 24 hours
        }
    }
    /**
     * Update lifecycle with proper stage transitions
     */
    static updateLifecycle(signal, metadata) {
        const currentStage = metadata.lifecycleStage || 'unknown';
        const newStage = this.determineStage(signal);
        // Create stage transition object if stage changed
        const stageTransition = currentStage !== newStage
            ? { from: currentStage, to: newStage }
            : undefined;
        return {
            ...metadata,
            lifecycleStage: newStage,
            stageTransition,
            previousStage: currentStage
        };
    }
    /**
     * Get stage summary statistics - count signals by their metadata.lifecycleStage
     */
    static getStageSummary(signals) {
        const summary = {
            new: 0,
            live: 0,
            decaying: 0,
            mature: 0
        };
        signals.forEach(signal => {
            // Use the signal's metadata.lifecycleStage if available, otherwise determine it
            const stage = signal.metadata?.lifecycleStage || this.determineStage(signal);
            if (summary.hasOwnProperty(stage)) {
                summary[stage]++;
            }
        });
        return summary;
    }
    /**
     * Update metadata with lifecycle information
     */
    static updateMetadata(signal, metadata) {
        const lifecycleStage = this.determineStage(signal);
        const previousStage = metadata.lifecycleStage;
        return {
            ...metadata,
            lifecycleStage,
            stageTransition: previousStage && previousStage !== lifecycleStage,
            previousStage: previousStage || 'unknown'
        };
    }
    /**
     * Process lifecycle stage transition
     */
    static processStageTransition(signal) {
        const currentStage = this.determineStage(signal);
        console.log(`[LifecycleManager] Stage transition: ${signal.id} -> ${currentStage}`);
        return currentStage;
    }
}
//# sourceMappingURL=lifecycle_manager.js.map