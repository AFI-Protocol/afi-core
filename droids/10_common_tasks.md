# AFI Core - Common Droid Tasks

Frequent tasks with step-by-step instructions.

---

## Task 1: Add a New Validator

**When**: You need to validate a new signal type or property.

**Steps**:

1. **Create validator file**:
   ```bash
   touch validators/MyNewValidator.ts
   ```

2. **Implement validator interface**:
   ```typescript
   // validators/MyNewValidator.ts
   import { Signal } from '../schemas/universal_signal_schema.mjs';
   
   export class MyNewValidator {
     validate(signal: Signal): boolean {
       // TODO: Implement validation logic
       return true;
     }
   }
   ```

3. **Add test**:
   ```bash
   touch tests/my_new_validator.test.ts
   ```

4. **Write test**:
   ```typescript
   // tests/my_new_validator.test.ts
   import { describe, it, expect } from 'vitest';
   import { MyNewValidator } from '../validators/MyNewValidator';
   
   describe('MyNewValidator', () => {
     it('should validate valid signal', () => {
       const validator = new MyNewValidator();
       const signal = { /* valid signal */ };
       expect(validator.validate(signal)).toBe(true);
     });
   });
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

**Expected time**: 30-60 minutes

---

## Task 2: Update Signal Schema

**When**: You need to add a new field to the signal format.

**⚠️ WARNING**: This is a breaking change. Coordinate with afi-reactor team.

**Steps**:

1. **Check downstream impact**:
   - afi-reactor uses this schema
   - afi-plugins may use this schema
   - Ask before proceeding

2. **Update schema**:
   ```typescript
   // schemas/universal_signal_schema.mjs
   export const SignalSchema = z.object({
     // ... existing fields
     newField: z.string().optional(),  // Add new field
   });
   ```

3. **Update TypeScript types**:
   ```typescript
   export type Signal = z.infer<typeof SignalSchema>;
   ```

4. **Add migration guide** (if breaking):
   ```markdown
   // docs/MIGRATION.md
   ## v2.0.0 - Added newField to Signal
   
   Signals now include optional `newField` property.
   Existing signals remain valid (field is optional).
   ```

5. **Update tests**:
   ```bash
   npm test
   ```

**Expected time**: 1-2 hours (including coordination)

---

## Task 3: Add Runtime Adapter

**When**: You need to integrate a new runtime or service.

**Steps**:

1. **Create adapter file**:
   ```bash
   touch runtime/myServiceAdapter.ts
   ```

2. **Implement adapter**:
   ```typescript
   // runtime/myServiceAdapter.ts
   export class MyServiceAdapter {
     async connect(): Promise<void> {
       // TODO: Implement connection logic
     }
     
     async disconnect(): Promise<void> {
       // TODO: Implement disconnection logic
     }
   }
   ```

3. **Add test**:
   ```typescript
   // tests/my_service_adapter.test.ts
   import { describe, it, expect } from 'vitest';
   import { MyServiceAdapter } from '../runtime/myServiceAdapter';
   
   describe('MyServiceAdapter', () => {
     it('should connect successfully', async () => {
       const adapter = new MyServiceAdapter();
       await expect(adapter.connect()).resolves.not.toThrow();
     });
   });
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

**Expected time**: 1-2 hours

---

## Task 4: Fix a Bug in Validator

**When**: A validator has incorrect logic.

**Steps**:

1. **Add failing test first**:
   ```typescript
   // tests/poi_validator.test.ts
   it('should reject signals with negative confidence', () => {
     const validator = new PoIValidator();
     const signal = { confidence: -0.5 };
     expect(validator.validate(signal)).toBe(false);
   });
   ```

2. **Run test** (should fail):
   ```bash
   npm test
   ```

3. **Fix validator**:
   ```typescript
   // validators/PoIValidator.ts
   validate(signal: Signal): boolean {
     if (signal.confidence < 0) return false;  // Add check
     // ... rest of validation
   }
   ```

4. **Run test** (should pass):
   ```bash
   npm test
   ```

**Expected time**: 15-30 minutes

---

## Task 5: Improve Documentation

**When**: Documentation is unclear or missing.

**Steps**:

1. **Identify gap**:
   - Missing function docs?
   - Unclear architecture?
   - No usage examples?

2. **Add documentation**:
   ```typescript
   /**
    * Validates a signal for Proof of Insight (PoI).
    * 
    * @param signal - The signal to validate
    * @returns true if signal is valid, false otherwise
    * 
    * @example
    * ```typescript
    * const validator = new PoIValidator();
    * const isValid = validator.validate(mySignal);
    * ```
    */
   validate(signal: Signal): boolean {
     // ...
   }
   ```

3. **Update docs/**:
   ```bash
   # Add architecture doc
   touch docs/VALIDATOR_ARCHITECTURE.md
   ```

**Expected time**: 30-60 minutes

---

## Getting Help

If stuck on any task:
1. Check `AGENTS.md` for constraints
2. Look at existing code for patterns
3. Run tests to verify changes
4. Ask human maintainer if unsure

---

**Last Updated**: 2025-11-22

