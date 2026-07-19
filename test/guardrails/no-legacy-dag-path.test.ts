import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Forward-only guardrail: the obsolete `src/dag/` orchestration path must never
 * return to afi-core. The DAG-node model was retired in favor of the
 * manifest-driven five-lane GraphExecutor runtime; `src/dag/` is a banned path.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("no-legacy-dag-path guardrail", () => {
  it("src/dag/ does not exist in afi-core", () => {
    expect(existsSync(resolve(REPO_ROOT, "src/dag"))).toBe(false);
  });
});
