// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ AFI Protocol — Utils Index              ┃
// ┃ Primary entry point for utilities       ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// Re-export all codex utilities (canonical source)
export * from './logCodex.js';
/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp) {
    if (!timestamp)
        return new Date().toISOString();
    if (typeof timestamp === 'string')
        return timestamp;
    return new Date(timestamp).toISOString();
}
/**
 * Calculate signal age in milliseconds
 */
export function calculateSignalAge(timestamp) {
    const now = new Date().getTime();
    const signalTime = typeof timestamp === 'string'
        ? new Date(timestamp).getTime()
        : timestamp;
    return now - signalTime;
}
/**
 * Validate signal structure
 */
export function validateSignalStructure(signal) {
    const errors = [];
    if (!signal) {
        errors.push('Signal is null or undefined');
        return { isValid: false, errors };
    }
    if (!signal.content && !signal.notes) {
        errors.push('Signal must have either content or notes');
    }
    if (!signal.timestamp) {
        errors.push('Signal must have a timestamp');
    }
    return { isValid: errors.length === 0, errors };
}
//# sourceMappingURL=index.js.map