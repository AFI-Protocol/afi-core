# Augmentcode Workspace Rules (AFI-Core)

These rules guide Augmentcode’s behavior for AFI-Core while maintaining flexibility for future repos like AFI-Engine.

---

**1. File Safety**
- Never overwrite or delete files without explicit approval.
- Always confirm before modifying any `dist/` output or generated files.

**2. ESM & Type Safety**
- Enforce ES Modules (import/export).
- Ensure `.d.ts` type files exist for all public modules.
- Flag any accidental CommonJS usage.

**3. DAG & Schema Integrity**
- DAG files must remain in `dist/dags/` with proper exports.
- Schemas live in `dist/schemas/` and must match AFI Codex & AOS requirements.
- Validators live in `dist/validators/` and must be properly exported.

**4. Incremental Development**
- All new files or scaffolding must be minimal and documented.
- Provide placeholders (stubs) for unimplemented features instead of leaving them blank.

**5. Observability & Logging**
- Always maintain descriptive comments for DAGs, schemas, and validators.
- Flag any missing documentation or unclear naming.

**6. Security & Approval**
- Never add dependencies or scripts without explicit approval.
- Any network or FS operations must be confirmed first.

---

These rules are applied to **AFI-Core first**, with the intent to extend them to AFI-Engine and other AFI repos later.