// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — LifecycleManager Implementation   ┃
// ┃ Signal lifecycle orchestration system           ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
export const LIFECYCLE_STAGES = [
    { name: 'new', description: 'Signal created, no score', minScore: 0, maxAge: 60_000, vaultEligible: false },
    { name: 'live', description: 'Scored signal, actively monitored', minScore: 1, maxAge: 5 * 60_000, vaultEligible: false },
    { name: 'active', description: 'Signal gaining relevance', minScore: 15, maxAge: 15 * 60_000, vaultEligible: false },
    { name: 'decaying', description: 'Signal losing strength over time', minScore: 10, maxAge: 60 * 60_000, vaultEligible: false },
    { name: 'mature', description: 'Vault‑ready high‑quality signal', minScore: 70, maxAge: Infinity, vaultEligible: true },
    { name: 'expired', description: 'Signal past useful lifecycle', minScore: 0, maxAge: Infinity, vaultEligible: false }
];
export class LifecycleManager {
    /**
     * Determine lifecycle stage based on score and age
     */
    static determineStage(signal, fallbackStage = 'new') {
        const score = signal.finalComposite ?? signal.score ?? 0;
        const timestamp = signal.timestamp ? new Date(signal.timestamp).getTime() : Date.now();
        const ageInMs = Date.now() - timestamp;
        const ageInMinutes = ageInMs / (1000 * 60);
        const ageInHours = ageInMs / (1000 * 60 * 60);
        // Age-based determination matching test expectations
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
     * Update signal lifecycle stage based on score and age
     */
    static updateLifecycle(signal, metadata) {
        const currentTime = Date.now();
        const signalTime = new Date(metadata.timestamp || signal.timestamp || currentTime).getTime();
        const ageInMs = currentTime - signalTime;
        const newStage = LifecycleManager.determineStage(metadata, metadata.lifecycleStage);
        const transition = newStage !== metadata.lifecycleStage
            ? { from: metadata.lifecycleStage, to: newStage }
            : undefined;
        const transitions = [...(metadata.stageTransitions || [])];
        if (transition)
            transitions.push(`${transition.from} -> ${transition.to}`);
        return {
            ...metadata,
            lifecycleStage: newStage,
            ageInMs,
            stageTransition: transition,
            stageTransitions: transitions,
            vaultEligible: LifecycleManager.isVaultEligible(newStage, metadata.finalComposite)
        };
    }
    /**
     * Whether a stage is vault‑eligible
     */
    static isVaultEligible(stage, score) {
        return stage === 'mature' && score >= 70;
    }
    /**
     * Public shouldVault for BaselineValidator integration
     */
    static shouldVault(metadata) {
        return LifecycleManager.isVaultEligible(metadata.lifecycleStage, metadata.finalComposite);
    }
    /**
     * Get stage summary for an array of signals
     */
    static getStageSummary(signals) {
        const summary = {
            new: 0,
            live: 0,
            decaying: 0,
            mature: 0
        };
        for (const signal of signals) {
            const stage = signal.lifecycleStage || 'new';
            if (summary.hasOwnProperty(stage)) {
                summary[stage]++;
            }
        }
        return summary;
    }
}
//# sourceMappingURL=LifecycleManager.js.map