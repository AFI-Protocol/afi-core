/**
 * DEM-CONTRACT: the deterministic enrichment-mapping interpreter
 * (afi.enrichment-mapping.v1 — DEM-GOV D-DEM-2(4)).
 *
 * Authorized by afi-governance
 * `decisions/declarative-enrichment-mapping-v0.1.md` §9 slot `DEM-CONTRACT`
 * (owner-authorized 2026-08-12). PURE by decision: no fs, no path resolution,
 * no afi-config dependency, no I/O, no clock, no randomness — the caller
 * supplies the parsed mapping document and the enriched view. Nothing here
 * reads a registry; no runtime invokes this yet (slot text). The runtime
 * seam that will call it is DEM-BIND, separately owner-gated.
 *
 * TOTALITY CONTRACT (the slot gate's "proven total and side-effect-free"):
 * every call terminates in either a deep-frozen {@link EnrichmentMappingResult}
 * or a thrown {@link EnrichmentMappingError} — that class only. Never a
 * partial fragment, never a defaulted result on refusal (fail closed,
 * D-DEM-5(2)/(7)). Inputs are never mutated.
 *
 * OPERATOR VOCABULARY (closed, D-DEM-3(1)): bind, default (inside a bind's
 * optionality only), band, recode, namespace-default. A mapping may never
 * express computation (D-DEM-3(2)); anything computational is a registered
 * producer whose projected fact a binding reads (D-DEM-3(3), `producedBy` —
 * a reference, never code). Every binding reads exactly ONE source path
 * (D-DEM-3(5)).
 *
 * ABSENCE (normative; mirrors the schema's x-afiConstraints.absenceSemantics):
 * a source resolves ABSENT iff its lane namespace is missing/undefined/null,
 * any path segment's own key is missing, or the resolved value is undefined
 * or null — exactly the retired adapter's `??` / `!= null` semantics
 * (froggy.enrichment_adapter.ts:221-226,:232-235,:250-255). Two DECLARED
 * divergences pin DEM-BIND's byte-for-byte obligation to the typed, finite
 * domain: a PRESENT value of the wrong declared type refuses
 * (source-type-mismatch) and a present non-finite number refuses
 * (non-finite-number — afi.hash.v1 has no non-finite policy at the
 * composition seam, and this value will one day sit upstream of a hash
 * preimage).
 */

/** Machine-checkable refusal reasons. The union IS the contract. */
export type EnrichmentMappingRefusalReason =
  | "not-an-object"
  | "schema-mismatch"
  | "bindings-invalid"
  | "operator-unknown"
  | "operator-invalid"
  | "optionality-invalid"
  | "band-table-invalid"
  | "recode-table-invalid"
  | "source-path-invalid"
  | "required-source-absent"
  | "source-type-mismatch"
  | "non-finite-number";

/** Fail-closed refusal thrown by {@link interpretEnrichmentMapping}. */
export class EnrichmentMappingError extends Error {
  readonly reason: EnrichmentMappingRefusalReason;
  /** Target name, when the refusal is binding-scoped. */
  readonly binding?: string;

  constructor(
    reason: EnrichmentMappingRefusalReason,
    detail: string,
    binding?: string
  ) {
    super(
      `enrichment mapping refused (${reason}${binding ? ` @ ${binding}` : ""}): ` +
        `${detail} — refusing to produce a fragment (fail-closed, no fallback; ` +
        `D-DEM-5(2)).`
    );
    this.name = "EnrichmentMappingError";
    this.reason = reason;
    if (binding !== undefined) this.binding = binding;
  }
}

export interface EnrichmentMappingResult {
  /**
   * One deep-frozen value per declared target. Strategy-agnostic on purpose
   * (D-DEM-2(4)): mapping content is registered data, not code.
   */
  readonly fragment: Readonly<Record<string, string | number | boolean>>;
  /**
   * Target names for which an ABSENT source fired a declared default:
   * (i) a bind's optionality default, (ii) a band's `absent` member,
   * (iii) a recode's `absent` member. NOT included: band `otherwise`
   * (present value, exhaustiveness row) and recode `fallback` on a PRESENT
   * unrecognized value (AR-GOV D-AR-3's total-table law — a value was read;
   * no absence degradation occurred). This is the D-DEM-5(3) fired-default
   * set DEM-BIND commits to the executionSummaryHash preimage. Computed now;
   * consumed by nothing yet.
   */
  readonly firedDefaults: readonly string[];
}

const SCHEMA_ID = "afi.enrichment-mapping.v1";
const LANES = Object.freeze([
  "technical",
  "pattern",
  "sentiment",
  "news",
  "aiMl",
]) as readonly string[];
const MAPPING_ID_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const TARGET_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const PATH_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/;
const PLUGIN_ID_RE = /^[a-z][a-z0-9-]*$/;
const BIND_TYPES = Object.freeze(["number", "integer", "boolean", "string"]);
const GROUNDS = Object.freeze(["composition", "producer-declared", "grandfather"]);

/** Own-property, read-once access (UwrProfileLoader idiom): a hostile getter
 * never gets a second read — each field is read once into a local. */
function ownValue(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function fail(
  reason: EnrichmentMappingRefusalReason,
  detail: string,
  binding?: string
): never {
  throw new EnrichmentMappingError(reason, detail, binding);
}

/** Compact value description for refusal messages (never throws). */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "string") return `"${value}"`;
  return `${typeof value}${typeof value === "number" ? ` ${String(value)}` : ""}`;
}

function isLiteral(v: unknown): v is string | number | boolean {
  return (
    typeof v === "string" || typeof v === "number" || typeof v === "boolean"
  );
}

function isOrdinalMember(v: unknown): v is number | string {
  return (typeof v === "number" && Number.isInteger(v)) || typeof v === "string";
}

function assertExactKeys(
  obj: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  reason: EnrichmentMappingRefusalReason,
  where: string,
  binding?: string
): void {
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      fail(reason, `${where}: missing required member "${key}"`, binding);
    }
  }
  for (const key of Object.keys(obj)) {
    if (!required.includes(key) && !optional.includes(key)) {
      fail(reason, `${where}: unknown member "${key}" (additionalProperties:false)`, binding);
    }
  }
}

interface ValidatedSourceRef {
  lane: string;
  path: readonly string[];
}

function validateSourceRef(
  raw: unknown,
  binding: string,
  operatorReason: EnrichmentMappingRefusalReason
): ValidatedSourceRef {
  if (!isPlainObject(raw)) {
    fail(operatorReason, `source must be an object, got ${describe(raw)}`, binding);
  }
  assertExactKeys(raw, ["lane", "path"], ["producedBy"], operatorReason, "source", binding);
  const lane = ownValue(raw, "lane");
  if (typeof lane !== "string" || !LANES.includes(lane)) {
    fail("source-path-invalid", `lane must be one of [${LANES.join(", ")}], got ${describe(lane)}`, binding);
  }
  const path = ownValue(raw, "path");
  if (typeof path !== "string" || path.length > 128 || !PATH_RE.test(path)) {
    fail("source-path-invalid", `path must match ${String(PATH_RE)}, got ${describe(path)}`, binding);
  }
  const producedBy = ownValue(raw, "producedBy");
  if (producedBy !== undefined) {
    if (!isPlainObject(producedBy)) {
      fail(operatorReason, `producedBy must be an object, got ${describe(producedBy)}`, binding);
    }
    assertExactKeys(producedBy, ["pluginId", "pluginVersion"], [], operatorReason, "producedBy", binding);
    const pluginId = ownValue(producedBy, "pluginId");
    const pluginVersion = ownValue(producedBy, "pluginVersion");
    if (typeof pluginId !== "string" || pluginId.length > 64 || !PLUGIN_ID_RE.test(pluginId)) {
      fail(operatorReason, `producedBy.pluginId invalid: ${describe(pluginId)}`, binding);
    }
    if (typeof pluginVersion !== "string" || !SEMVER_RE.test(pluginVersion)) {
      fail(operatorReason, `producedBy.pluginVersion invalid: ${describe(pluginVersion)}`, binding);
    }
  }
  return { lane, path: Object.freeze(path.split(".")) };
}

interface ValidatedOptionality {
  ground: string;
  defaultValue: string | number | boolean;
}

function validateOptionality(
  raw: unknown,
  binding: string
): ValidatedOptionality {
  if (!isPlainObject(raw)) {
    fail("optionality-invalid", `optionality must be an object, got ${describe(raw)}`, binding);
  }
  assertExactKeys(raw, ["ground", "default"], ["producerRef"], "optionality-invalid", "optionality", binding);
  const ground = ownValue(raw, "ground");
  if (typeof ground !== "string" || !GROUNDS.includes(ground)) {
    fail("optionality-invalid", `ground must be one of [${GROUNDS.join(", ")}], got ${describe(ground)}`, binding);
  }
  const defaultValue = ownValue(raw, "default");
  if (!isLiteral(defaultValue)) {
    fail("optionality-invalid", `default must be a string/number/boolean literal, got ${describe(defaultValue)}`, binding);
  }
  if (typeof defaultValue === "number" && !Number.isFinite(defaultValue)) {
    fail("non-finite-number", `optionality default must be finite, got ${String(defaultValue)}`, binding);
  }
  const producerRef = ownValue(raw, "producerRef");
  if (ground === "producer-declared") {
    if (producerRef === undefined) {
      fail("optionality-invalid", `ground "producer-declared" requires producerRef (D-DEM-5(4)(b) enumeration)`, binding);
    }
    if (!isPlainObject(producerRef)) {
      fail("optionality-invalid", `producerRef must be an object, got ${describe(producerRef)}`, binding);
    }
    assertExactKeys(producerRef, ["pluginId", "pluginVersion"], [], "optionality-invalid", "producerRef", binding);
    const pluginId = ownValue(producerRef, "pluginId");
    const pluginVersion = ownValue(producerRef, "pluginVersion");
    if (typeof pluginId !== "string" || pluginId.length > 64 || !PLUGIN_ID_RE.test(pluginId)) {
      fail("optionality-invalid", `producerRef.pluginId invalid: ${describe(pluginId)}`, binding);
    }
    if (typeof pluginVersion !== "string" || !SEMVER_RE.test(pluginVersion)) {
      fail("optionality-invalid", `producerRef.pluginVersion invalid: ${describe(pluginVersion)}`, binding);
    }
  } else if (producerRef !== undefined) {
    fail("optionality-invalid", `ground "${ground}" must not carry producerRef`, binding);
  }
  return { ground, defaultValue };
}

interface BandRow {
  op: "gte" | "gt";
  threshold: number;
  value: number | string;
}

type ValidatedBinding =
  | {
      kind: "bind";
      source: ValidatedSourceRef;
      type: string;
      optionality?: ValidatedOptionality;
    }
  | {
      kind: "band";
      source: ValidatedSourceRef;
      rows: readonly BandRow[];
      otherwise: number | string;
      absent: number | string;
    }
  | {
      kind: "recode";
      source: ValidatedSourceRef;
      table: ReadonlyMap<string, string | number | boolean>;
      fallback: string | number | boolean;
      absent: string | number | boolean;
    };

function validateBinding(target: string, raw: unknown): ValidatedBinding {
  if (!isPlainObject(raw)) {
    fail("bindings-invalid", `binding must be an object, got ${describe(raw)}`, target);
  }
  const operator = ownValue(raw, "operator");
  if (operator !== "bind" && operator !== "band" && operator !== "recode") {
    fail("operator-unknown", `operator must be "bind" | "band" | "recode", got ${describe(operator)}`, target);
  }

  if (operator === "bind") {
    assertExactKeys(raw, ["operator", "source", "type"], ["optionality"], "operator-invalid", "bind", target);
    const source = validateSourceRef(ownValue(raw, "source"), target, "operator-invalid");
    const type = ownValue(raw, "type");
    if (typeof type !== "string" || !BIND_TYPES.includes(type)) {
      fail("operator-invalid", `bind.type must be one of [${BIND_TYPES.join(", ")}], got ${describe(type)}`, target);
    }
    const optionalityRaw = ownValue(raw, "optionality");
    const optionality =
      optionalityRaw === undefined
        ? undefined
        : validateOptionality(optionalityRaw, target);
    return optionality
      ? { kind: "bind", source, type, optionality }
      : { kind: "bind", source, type };
  }

  if (operator === "band") {
    assertExactKeys(raw, ["operator", "source", "rows", "otherwise", "absent"], [], "band-table-invalid", "band", target);
    const source = validateSourceRef(ownValue(raw, "source"), target, "band-table-invalid");
    const rowsRaw = ownValue(raw, "rows");
    if (!Array.isArray(rowsRaw) || rowsRaw.length < 1) {
      fail("band-table-invalid", `rows must be a non-empty array, got ${describe(rowsRaw)}`, target);
    }
    const rows: BandRow[] = [];
    for (const rowRaw of rowsRaw) {
      if (!isPlainObject(rowRaw)) {
        fail("band-table-invalid", `row must be an object, got ${describe(rowRaw)}`, target);
      }
      assertExactKeys(rowRaw, ["when", "value"], [], "band-table-invalid", "band row", target);
      const when = ownValue(rowRaw, "when");
      if (!isPlainObject(when)) {
        fail("band-table-invalid", `row.when must be an object, got ${describe(when)}`, target);
      }
      const whenKeys = Object.keys(when);
      if (whenKeys.length !== 1 || (whenKeys[0] !== "gte" && whenKeys[0] !== "gt")) {
        fail("band-table-invalid", `row.when must carry exactly one of {gte, gt}, got [${whenKeys.join(", ")}]`, target);
      }
      const op = whenKeys[0] as "gte" | "gt";
      const threshold = ownValue(when, op);
      if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
        fail("band-table-invalid", `row.when.${op} must be a finite number, got ${describe(threshold)}`, target);
      }
      const value = ownValue(rowRaw, "value");
      if (!isOrdinalMember(value)) {
        fail("band-table-invalid", `row.value must be an integer or string, got ${describe(value)}`, target);
      }
      rows.push({ op, threshold, value });
    }
    // x-afiConstraints.bandTableDiscipline: strictly decreasing thresholds
    // top-to-bottom (EQ-GOV D-EQ-2 ordered-threshold form).
    for (let i = 1; i < rows.length; i += 1) {
      if (!(rows[i].threshold < rows[i - 1].threshold)) {
        fail(
          "band-table-invalid",
          `rows must have strictly decreasing thresholds; row ${i} (${rows[i].threshold}) is not below row ${i - 1} (${rows[i - 1].threshold})`,
          target
        );
      }
    }
    const otherwise = ownValue(raw, "otherwise");
    if (!isOrdinalMember(otherwise)) {
      fail("band-table-invalid", `otherwise must be an integer or string, got ${describe(otherwise)}`, target);
    }
    const absent = ownValue(raw, "absent");
    if (!isOrdinalMember(absent)) {
      fail("band-table-invalid", `absent must be an integer or string, got ${describe(absent)}`, target);
    }
    return { kind: "band", source, rows: Object.freeze(rows), otherwise, absent };
  }

  // recode
  assertExactKeys(raw, ["operator", "source", "table", "fallback", "absent"], [], "recode-table-invalid", "recode", target);
  const source = validateSourceRef(ownValue(raw, "source"), target, "recode-table-invalid");
  const tableRaw = ownValue(raw, "table");
  if (!isPlainObject(tableRaw) || Object.keys(tableRaw).length < 1) {
    fail("recode-table-invalid", `table must be a non-empty object, got ${describe(tableRaw)}`, target);
  }
  const table = new Map<string, string | number | boolean>();
  for (const key of Object.keys(tableRaw)) {
    if (key.length > 128) {
      fail("recode-table-invalid", `table key exceeds 128 chars`, target);
    }
    const value = ownValue(tableRaw, key);
    if (
      typeof value !== "string" &&
      !(typeof value === "number" && Number.isInteger(value)) &&
      typeof value !== "boolean"
    ) {
      fail("recode-table-invalid", `table["${key}"] must be a string/integer/boolean, got ${describe(value)}`, target);
    }
    table.set(key, value);
  }
  const fallback = ownValue(raw, "fallback");
  if (
    typeof fallback !== "string" &&
    !(typeof fallback === "number" && Number.isInteger(fallback)) &&
    typeof fallback !== "boolean"
  ) {
    fail("recode-table-invalid", `fallback must be a string/integer/boolean, got ${describe(fallback)}`, target);
  }
  const absent = ownValue(raw, "absent");
  if (
    typeof absent !== "string" &&
    !(typeof absent === "number" && Number.isInteger(absent)) &&
    typeof absent !== "boolean"
  ) {
    fail("recode-table-invalid", `absent must be a string/integer/boolean, got ${describe(absent)}`, target);
  }
  return { kind: "recode", source, table, fallback, absent };
}

/**
 * Resolve a source path against the enriched view under the normative
 * ABSENCE definition. Returns { absent: true } or the present value.
 * Never throws on structure: a missing/null/undefined namespace or segment,
 * or a non-object intermediate, resolves ABSENT (the key cannot exist).
 * Type discipline over PRESENT values is the caller's per-operator concern.
 */
function resolveSource(
  view: Record<string, unknown>,
  source: ValidatedSourceRef
): { absent: true } | { absent: false; value: unknown } {
  const laneValue = ownValue(view, source.lane);
  if (laneValue === undefined || laneValue === null) return { absent: true };
  let cursor: unknown = laneValue;
  for (const segment of source.path) {
    if (!isPlainObject(cursor)) return { absent: true };
    cursor = ownValue(cursor, segment);
    if (cursor === undefined || cursor === null) return { absent: true };
  }
  return { absent: false, value: cursor };
}

/**
 * Interpret a mapping document over an enriched view.
 *
 * @param mappingDoc - Already-parsed afi.enrichment-mapping.v1 document
 *                     (caller does the I/O; this kernel never reads a file)
 * @param enrichedView - The enriched view object (lane namespaces at top level)
 * @returns Deep-frozen fragment + the D-DEM-5(3) fired-default set
 * @throws EnrichmentMappingError on any structural or evaluation refusal —
 *         that class only; an escaping TypeError is a totality defect
 */
export function interpretEnrichmentMapping(
  mappingDoc: unknown,
  enrichedView: unknown
): EnrichmentMappingResult {
  if (!isPlainObject(mappingDoc)) {
    fail("not-an-object", `mapping document must be an object, got ${describe(mappingDoc)}`);
  }
  if (!isPlainObject(enrichedView)) {
    fail("not-an-object", `enriched view must be an object, got ${describe(enrichedView)}`);
  }

  // ---- structural validation, whole document first (fail-closed) ----
  assertExactKeys(
    mappingDoc,
    ["schema", "mappingId", "version", "bindings"],
    ["description", "namespaceDefaults"],
    "schema-mismatch",
    "document"
  );
  const schema = ownValue(mappingDoc, "schema");
  if (schema !== SCHEMA_ID) {
    fail("schema-mismatch", `schema must be "${SCHEMA_ID}", got ${describe(schema)}`);
  }
  const mappingId = ownValue(mappingDoc, "mappingId");
  if (typeof mappingId !== "string" || mappingId.length > 64 || !MAPPING_ID_RE.test(mappingId)) {
    fail("schema-mismatch", `mappingId must match ${String(MAPPING_ID_RE)}, got ${describe(mappingId)}`);
  }
  const version = ownValue(mappingDoc, "version");
  if (typeof version !== "string" || !SEMVER_RE.test(version)) {
    fail("schema-mismatch", `version must be semver, got ${describe(version)}`);
  }
  const desc = ownValue(mappingDoc, "description");
  if (desc !== undefined && (typeof desc !== "string" || desc.length > 512)) {
    fail("schema-mismatch", `description must be a string (max 512), got ${describe(desc)}`);
  }
  const nsDefaults = ownValue(mappingDoc, "namespaceDefaults");
  if (nsDefaults !== undefined) {
    if (!Array.isArray(nsDefaults)) {
      fail("schema-mismatch", `namespaceDefaults must be an array, got ${describe(nsDefaults)}`);
    }
    const seen = new Set<string>();
    for (const lane of nsDefaults) {
      if (typeof lane !== "string" || !LANES.includes(lane)) {
        fail("schema-mismatch", `namespaceDefaults entry must be a lane, got ${describe(lane)}`);
      }
      if (seen.has(lane)) {
        fail("schema-mismatch", `namespaceDefaults entries must be unique; "${lane}" repeats`);
      }
      seen.add(lane);
    }
  }
  const bindingsRaw = ownValue(mappingDoc, "bindings");
  if (!isPlainObject(bindingsRaw) || Object.keys(bindingsRaw).length < 1) {
    fail("bindings-invalid", `bindings must be a non-empty object, got ${describe(bindingsRaw)}`);
  }
  const validated: Array<[string, ValidatedBinding]> = [];
  for (const target of Object.keys(bindingsRaw)) {
    if (!TARGET_RE.test(target)) {
      fail("bindings-invalid", `target name "${target}" must match ${String(TARGET_RE)}`);
    }
    validated.push([target, validateBinding(target, ownValue(bindingsRaw, target))]);
  }

  // ---- evaluation (only after the whole document validated) ----
  const fragment: Record<string, string | number | boolean> = {};
  const firedDefaults: string[] = [];

  for (const [target, binding] of validated) {
    const resolved = resolveSource(enrichedView, binding.source);

    if (binding.kind === "bind") {
      if (resolved.absent) {
        if (binding.optionality) {
          fragment[target] = binding.optionality.defaultValue;
          firedDefaults.push(target);
          continue;
        }
        fail("required-source-absent", `required source ${binding.source.lane}.${binding.source.path.join(".")} is absent`, target);
      }
      const value = (resolved as { value: unknown }).value;
      const t = binding.type;
      if (t === "number") {
        if (typeof value !== "number") {
          fail("source-type-mismatch", `declared number, got ${describe(value)}`, target);
        }
        if (!Number.isFinite(value)) {
          fail("non-finite-number", `resolved number is ${String(value)}`, target);
        }
        fragment[target] = value;
      } else if (t === "integer") {
        if (typeof value !== "number" || !Number.isInteger(value)) {
          fail("source-type-mismatch", `declared integer, got ${describe(value)}`, target);
        }
        fragment[target] = value;
      } else if (t === "boolean") {
        if (typeof value !== "boolean") {
          fail("source-type-mismatch", `declared boolean, got ${describe(value)}`, target);
        }
        fragment[target] = value;
      } else {
        if (typeof value !== "string") {
          fail("source-type-mismatch", `declared string, got ${describe(value)}`, target);
        }
        fragment[target] = value;
      }
      continue;
    }

    if (binding.kind === "band") {
      if (resolved.absent) {
        fragment[target] = binding.absent;
        firedDefaults.push(target);
        continue;
      }
      const value = (resolved as { value: unknown }).value;
      if (typeof value !== "number") {
        fail("source-type-mismatch", `band source must resolve to a number, got ${describe(value)}`, target);
      }
      if (!Number.isFinite(value)) {
        fail("non-finite-number", `band source resolved to ${String(value)}`, target);
      }
      let matched: number | string | undefined;
      for (const row of binding.rows) {
        if (row.op === "gte" ? value >= row.threshold : value > row.threshold) {
          matched = row.value;
          break;
        }
      }
      // `otherwise` is the exhaustiveness row for a PRESENT value: not a
      // fired default (a value was read; no absence degradation occurred).
      fragment[target] = matched === undefined ? binding.otherwise : matched;
      continue;
    }

    // recode
    if (resolved.absent) {
      fragment[target] = binding.absent;
      firedDefaults.push(target);
      continue;
    }
    const value = (resolved as { value: unknown }).value;
    if (typeof value !== "string") {
      fail("source-type-mismatch", `recode source must resolve to a string, got ${describe(value)}`, target);
    }
    // `fallback` on a PRESENT unrecognized value is AR-GOV D-AR-3's
    // total-table law, not a fired default.
    fragment[target] = binding.table.has(value)
      ? (binding.table.get(value) as string | number | boolean)
      : binding.fallback;
  }

  return Object.freeze({
    fragment: Object.freeze(fragment),
    firedDefaults: Object.freeze(firedDefaults),
  });
}

/** Never throws; renders any error as a stable one-line refusal message. */
export function describeEnrichmentMappingError(err: unknown): string {
  if (err instanceof EnrichmentMappingError) {
    return `${err.reason}${err.binding ? ` @ ${err.binding}` : ""}: ${err.message}`;
  }
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return `non-error refusal: ${describe(err)}`;
}
