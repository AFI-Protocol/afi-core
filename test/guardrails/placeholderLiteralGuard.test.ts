/**
 * DEM-PLACEHOLDER-GUARD — the terminal CI guard over afi-core/analysts/**
 * (D-DEM-4(5); DEM-GOV §9, owner-authorized 2026-08-25).
 *
 * Gate: "Guard proven to fail on a reintroduced literal by a negative test,
 * and proven NOT to fire on a registered mapping's declared literals or on
 * liquiditySwept; the D-DEM-4(2) inventory empty."
 */
import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { scanForPlaceholderLiterals } from "../../validators/PlaceholderLiteralGuard.js";
import { NEWEST_REGISTERED_FROGGY_MAPPING } from "../../analysts/__tests__/support/froggyMappings.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TSCONFIG = path.join(REPO_ROOT, "tsconfig.json");
const BOUNDS = ["analysts"]; // D-DEM-4(5)'s afi-core bound

/**
 * D-DEM-4(5)'s mapping-sourced exemption, read from the REGISTERED mapping
 * itself: only a value equal to a declared `default` for that same target is
 * exempt. Today that is the two D-DEM-5(4) grandfathers the retired adapter
 * still applies (its physical deletion is reserved by DEM-BIND ruling R1).
 */
function registeredDefaults(): Record<string, string | number | boolean> {
  const doc = NEWEST_REGISTERED_FROGGY_MAPPING() as {
    bindings: Record<string, { optionality?: { default?: string | number | boolean } }>;
  };
  const out: Record<string, string | number | boolean> = {};
  for (const [target, binding] of Object.entries(doc.bindings)) {
    if (binding.optionality?.default !== undefined) out[target] = binding.optionality.default;
  }
  return out;
}

const scan = (extraSources?: Array<{ fileName: string; content: string }>) =>
  scanForPlaceholderLiterals({
    tsconfigPath: TSCONFIG,
    bounds: BOUNDS,
    repoRoot: REPO_ROOT,
    mappingDeclaredDefaults: registeredDefaults(),
    extraSources,
  });

/** A fixture inside the bound, compiled against the real declarations. */
const fixture = (body: string) => [
  {
    fileName: path.join(REPO_ROOT, "analysts", "__guard_fixture__.ts"),
    content: `import type { FroggyTrendPullbackInput } from "./froggy.trend_pullback_v1.js";\n${body}\n`,
  },
];

describe("DEM-PLACEHOLDER-GUARD: the production path carries no placeholder literal", () => {
  it("afi-core/analysts/** is CLEAN — the D-DEM-4(2) inventory is empty", async () => {
    expect(await scan()).toEqual([]);
  }, 60_000);

  it("the exemption is exactly the REGISTERED document's declared defaults — nothing wider", () => {
    // D-DEM-4(5) exempts "a registered mapping document's declared `default`
    // literals". Read from the document itself, that is: the two D-DEM-5(4)
    // grandfathers (which the retired adapter still applies — its physical
    // deletion is reserved by DEM-BIND ruling R1) and the PLAN slot's
    // producer-declared floor. The exemption is pinned to their VALUES, so the
    // adapter's dormant copy cannot drift from the registered document.
    expect(registeredDefaults()).toEqual({
      distanceFromDailyEmaPct: 0,
      pulledBackIntoSweetSpot: false,
      rrMultiplePlanned: 1,
    });
  });

  it("a SYNTHESIS is still caught even when one of its arms is a registered default", async () => {
    // The retired `pulledBackIntoSweetSpot && !brokeEmaWithBody ? 2 : 1` form:
    // a conditional has no single constant value, so the exemption cannot
    // apply and the guard fires.
    const findings = await scan(
      fixture(`declare const a: boolean; export const s = { rrMultiplePlanned: a ? 2 : 1 };`)
    );
    expect(findings.map((f) => f.field)).toContain("rrMultiplePlanned");
  }, 60_000);

  it("a DIFFERENT literal at a grandfathered site still fires (the exemption cannot be abused)", async () => {
    const findings = await scan(
      fixture(`declare const t: { emaDistancePct?: number }; export const g = { distanceFromDailyEmaPct: t.emaDistancePct ?? 1 };`)
    );
    expect(findings.map((f) => f.field)).toContain("distanceFromDailyEmaPct");
  }, 60_000);

  it("the retired inventory's identifiers and literals are gone from the CODE", () => {
    // Comments naming the retired constants are documentation, not code.
    const raw = readFileSync(path.join(REPO_ROOT, "analysts/froggy.enrichment_adapter.ts"), "utf-8");
    const adapter = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
    expect(adapter).not.toContain("BROKE_EMA_WITH_BODY_UNIMPLEMENTED_STUB");
    expect(adapter).not.toMatch(/haFlatBackConfirmed:\s*false/);
    expect(adapter).not.toMatch(/weeklyBias\s*=\s*"neutral"/);
    expect(adapter).not.toMatch(/dailyBias\s*=\s*"neutral"/);
    expect(adapter).not.toMatch(/rrMultiplePlanned\s*=/);
    // No compatibility shim, alias, dual-run flag or commented-out copy
    // survives (D-FLPR-6 forward-only; the GUARD gate's last clause).
    expect(adapter).not.toMatch(/@deprecated|LEGACY_|_OLD\b|dualRun|fallbackFlag/i);
  });
});

describe("DEM-PLACEHOLDER-GUARD: the negative test — the guard FAILS on a reintroduced literal", () => {
  it.each([
    ["a bare literal", `export const x: Partial<FroggyTrendPullbackInput> = { haFlatBackConfirmed: false };`, "haFlatBackConfirmed"],
    ["an `as const` literal", `export const weeklyBias = "neutral" as const; export const y = { weeklyBias };`, "weeklyBias"],
    ["a synthesized conditional", `declare const a: boolean; export const z = { rrMultiplePlanned: a ? 2 : 1 };`, "rrMultiplePlanned"],
    ["a nullish fallback to a constant", `declare const t: { brokeEmaWithBody?: boolean }; export const w = { brokeEmaWithBody: t.brokeEmaWithBody ?? false };`, "brokeEmaWithBody"],
    ["a variable declaration", `export const dailyBias = "neutral";`, "dailyBias"],
    ["an assignment expression", `declare const o: FroggyTrendPullbackInput; export function f() { o.triggerPatternQuality = 0; }`, "triggerPatternQuality"],
  ])("catches %s", async (_label, body, field) => {
    const findings = await scan(fixture(body));
    expect(findings.map((f) => f.field)).toContain(field);
  }, 60_000);

  it("catches the exact retired form: a constant IMPORTED ACROSS THE PACKAGE BOUNDARY (a .d.ts literal type)", async () => {
    // This is the form D-DEM-4(2) named at afi-reactor laneView.ts:79 — an
    // identifier whose initializer lives in another package's declarations.
    // A syntax-only guard cannot see it; the type checker can.
    const findings = await scan([
      {
        fileName: path.join(REPO_ROOT, "analysts", "__guard_stub__.ts"),
        content: `export const REINTRODUCED_STUB = false as const;\n`,
      },
      {
        fileName: path.join(REPO_ROOT, "analysts", "__guard_fixture__.ts"),
        content:
          `import { REINTRODUCED_STUB } from "./__guard_stub__.js";\n` +
          `export const v = { brokeEmaWithBody: REINTRODUCED_STUB };\n`,
      },
    ]);
    const hit = findings.find((f) => f.field === "brokeEmaWithBody");
    expect(hit).toBeDefined();
    expect(hit!.reason).toMatch(/literal type/);
  }, 60_000);
});

describe("DEM-PLACEHOLDER-GUARD: the exemptions the accepted text states", () => {
  it("does NOT fire on liquiditySwept — the reserved two-lane computation (D-DEM-3(5))", async () => {
    const findings = await scan(fixture(`export const q = { liquiditySwept: false };`));
    expect(findings.map((f) => f.field)).not.toContain("liquiditySwept");
  }, 60_000);

  it("does NOT fire on a mapping-sourced value: an interpreter fragment is not a constant", async () => {
    const findings = await scan(
      fixture(
        `declare const fragment: Record<string, string | number | boolean>;\n` +
          `export const r = { weeklyBias: fragment.weeklyBias, rrMultiplePlanned: fragment.rrMultiplePlanned };`
      )
    );
    expect(findings).toEqual([]);
  }, 60_000);

  it("does NOT fire on a mapping DOCUMENT's own declared literals (band ordinals, recode targets, defaults)", async () => {
    // A mapping document is DATA: its keys are binding targets, not scorer-input
    // assignments, and its literals are the registered values themselves.
    const findings = await scan(
      fixture(
        `export const doc = { bindings: { weeklyBias: { operator: "recode", table: { bullish: "long" }, fallback: "neutral", absent: "neutral" },\n` +
          `  triggerPatternQuality: { operator: "band", rows: [{ when: { gte: 75 }, value: 3 }], otherwise: 0, absent: 0 },\n` +
          `  rrMultiplePlanned: { operator: "bind", optionality: { ground: "producer-declared", default: 1 } } } };`
      )
    );
    // `weeklyBias:` / `triggerPatternQuality:` / `rrMultiplePlanned:` here are
    // keys of a mapping document whose values are OBJECTS — not constants —
    // so nothing fires.
    expect(findings).toEqual([]);
  }, 60_000);

  it("does NOT fire on test fixtures that build inputs by hand (test dirs are exempt)", async () => {
    const findings = await scan([
      {
        fileName: path.join(REPO_ROOT, "analysts", "__tests__", "__guard_fixture__.test.ts"),
        content: `export const t = { weeklyBias: "neutral", haFlatBackConfirmed: false };\n`,
      },
    ]);
    expect(findings).toEqual([]);
  }, 60_000);

  it("does NOT fire on the composer's predicate domain table (predicates are not constants)", async () => {
    const findings = await scan(
      fixture(
        `const isBias = (v: unknown) => v === "long";\n` +
          `export const table = { weeklyBias: { describe: "long|short|neutral", test: isBias } };`
      )
    );
    // The value is an object; the field name is a key of a lookup table.
    expect(findings).toEqual([]);
  }, 60_000);
});
