# AFI Core - Safe Patch Patterns

How to make safe, reviewable changes.

---

## Pattern 1: Additive Changes Only

**Good** ✅:
```typescript
// Add new validator without changing existing ones
export class NewValidator {
  validate(signal: Signal): boolean {
    return true;
  }
}
```

**Bad** ❌:
```typescript
// Modifying existing validator breaks downstream
export class PoIValidator {
  validate(signal: Signal): boolean {
    // Changed logic - RISKY!
    return signal.confidence > 0.9;  // Was 0.7
  }
}
```

**Why**: Additive changes are safer and easier to review.

---

## Pattern 2: Test-First Development

**Good** ✅:
```typescript
// 1. Write failing test
it('should validate signal with metadata', () => {
  const validator = new PoIValidator();
  const signal = { metadata: { source: 'test' } };
  expect(validator.validate(signal)).toBe(true);
});

// 2. Implement feature
export class PoIValidator {
  validate(signal: Signal): boolean {
    if (!signal.metadata) return false;
    return true;
  }
}

// 3. Test passes
```

**Why**: Tests document expected behavior and catch regressions.

---

## Pattern 3: Small, Focused Commits

**Good** ✅:
```
Commit 1: Add SignalMetadataValidator stub
Commit 2: Implement validation logic
Commit 3: Add tests for edge cases
```

**Bad** ❌:
```
Commit 1: Refactor all validators, add new schema, update tests, fix bugs
```

**Why**: Small commits are easier to review and revert if needed.

---

## Pattern 4: Clear TODO Comments

**Good** ✅:
```typescript
// TODO(droid): Add validation for signal confidence threshold
// Expected behavior: Reject signals with confidence < 0.7
// Test case: tests/confidence_validator.test.ts
// Blocked by: Schema update in PR #123
export function validateConfidence(signal: Signal): boolean {
  // Stub: Always returns true for now
  return true;
}
```

**Bad** ❌:
```typescript
// TODO: fix this
export function validateConfidence(signal: Signal): boolean {
  return true;
}
```

**Why**: Clear TODOs help next contributor understand intent.

---

## Pattern 5: Type-Safe Changes

**Good** ✅:
```typescript
// Use TypeScript types to catch errors
export function processSignal(signal: Signal): ProcessedSignal {
  return {
    id: signal.id,
    confidence: signal.confidence,
    // TypeScript ensures all required fields are present
  };
}
```

**Bad** ❌:
```typescript
// Using 'any' bypasses type safety
export function processSignal(signal: any): any {
  return signal;  // No type checking!
}
```

**Why**: Types catch bugs at compile time.

---

## Pattern 6: Preserve Backward Compatibility

**Good** ✅:
```typescript
// Add optional field to schema
export const SignalSchema = z.object({
  id: z.string(),
  confidence: z.number(),
  metadata: z.object({}).optional(),  // New field is optional
});
```

**Bad** ❌:
```typescript
// Add required field (breaks existing signals)
export const SignalSchema = z.object({
  id: z.string(),
  confidence: z.number(),
  metadata: z.object({}),  // Required! Breaks old signals
});
```

**Why**: Breaking changes require coordination and migration.

---

## Pattern 7: Document Breaking Changes

**Good** ✅:
```markdown
## BREAKING CHANGE: Signal schema v2.0.0

### What changed
- Added required `metadata` field to Signal

### Migration guide
Update all signal creation to include metadata:
\`\`\`typescript
const signal = {
  id: '123',
  confidence: 0.8,
  metadata: {},  // Add this
};
\`\`\`

### Affected repos
- afi-reactor (update DAG nodes)
- afi-plugins (update signal processors)
```

**Why**: Breaking changes need clear migration paths.

---

## Pattern 8: Idempotent Operations

**Good** ✅:
```typescript
// Can be run multiple times safely
export function registerValidator(name: string, validator: Validator): void {
  if (registry.has(name)) {
    console.log(`Validator ${name} already registered`);
    return;
  }
  registry.set(name, validator);
}
```

**Bad** ❌:
```typescript
// Fails if run twice
export function registerValidator(name: string, validator: Validator): void {
  if (registry.has(name)) {
    throw new Error(`Validator ${name} already exists`);
  }
  registry.set(name, validator);
}
```

**Why**: Idempotent operations are safer for automation.

---

## Pattern 9: Fail Fast with Clear Errors

**Good** ✅:
```typescript
export function validateSignal(signal: Signal): void {
  if (!signal.id) {
    throw new Error('Signal missing required field: id');
  }
  if (signal.confidence < 0 || signal.confidence > 1) {
    throw new Error(`Invalid confidence: ${signal.confidence}. Must be 0-1.`);
  }
}
```

**Bad** ❌:
```typescript
export function validateSignal(signal: Signal): void {
  if (!signal.id || signal.confidence < 0) {
    throw new Error('Invalid signal');  // Unclear what's wrong
  }
}
```

**Why**: Clear errors help debugging.

---

## Pattern 10: Use Existing Patterns

**Good** ✅:
```typescript
// Follow existing validator pattern
export class MyValidator {
  validate(signal: Signal): boolean {
    // Same interface as PoIValidator
    return true;
  }
}
```

**Bad** ❌:
```typescript
// Inventing new pattern
export class MyValidator {
  check(data: any): { valid: boolean; errors: string[] } {
    // Different interface - confusing!
    return { valid: true, errors: [] };
  }
}
```

**Why**: Consistency reduces cognitive load.

---

## Checklist Before Submitting

- [ ] Changes are additive (no deletions unless necessary)
- [ ] Tests added for new code
- [ ] Tests pass locally (`npm test`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] No breaking changes (or documented if necessary)
- [ ] Clear commit messages
- [ ] TODO comments are descriptive
- [ ] Follows existing code patterns

---

**Last Updated**: 2025-11-22

