const LIFECYCLE_STAGES = [
    { name: 'fresh', minAge: 0, maxAge: 1, vaultEligible: false },
    { name: 'new', minAge: 1, maxAge: 24, vaultEligible: false },
    { name: 'mature', minAge: 24, maxAge: 168, vaultEligible: true },
    { name: 'aging', minAge: 168, maxAge: 720, vaultEligible: true },
    { name: 'stale', minAge: 720, maxAge: Infinity, vaultEligible: false }
];
export class LifecycleManager {
    /**
     * Update signal lifecycle based on age and current stage
     */
    static updateLifecycle(signal, metadata) {
        const currentStage = metadata.lifecycleStage || 'fresh';
        const ageHours = LifecycleManager.getSignalAge(signal);
        const newStage = LifecycleManager.determineStage(ageHours);
        if (newStage !== currentStage) {
            metadata.stageTransition = {
                from: currentStage,
                to: newStage
            };
            metadata.lifecycleStage = newStage;
            console.log(`[LifecycleManager] Signal ${metadata.signalId} transitioned: ${currentStage} → ${newStage}`);
        }
        return metadata;
    }
    /**
     * Determine if signal should be vaulted
     */
    static shouldVault(metadata) {
        const stage = LIFECYCLE_STAGES.find(s => s.name === metadata.lifecycleStage);
        const vaultEligible = stage?.vaultEligible ?? false;
        return vaultEligible && metadata.finalComposite >= 70;
    }
    /**
     * Get signal age in hours
     */
    static getSignalAge(signal) {
        const timestamp = signal?.timestamp || Date.now();
        const signalTime = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
        return (Date.now() - signalTime) / (1000 * 60 * 60);
    }
    /**
     * Determine lifecycle stage based on age
     */
    static determineStage(ageHours) {
        const stage = LIFECYCLE_STAGES.find(s => ageHours >= s.minAge && ageHours < s.maxAge);
        return stage?.name || 'stale';
    }
}
//# sourceMappingURL=LifecycleManager.js.map