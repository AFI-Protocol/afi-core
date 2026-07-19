import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Forward-only guardrail: the retired generic-orchestration source path must
 * never return to afi-core. That model was retired in favour of the
 * manifest-driven five-lane GraphExecutor runtime; the path is banned.
 * The banned path is assembled from fragments at runtime, so this guard's own
 * source contains no complete retired literal (no self-exemption required).
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RETIRED_ORCHESTRATION_PATH = ["src/", "dag"].join("");

describe("no-legacy-orchestration-path guardrail", () => {
  it("the retired generic-orchestration source path does not exist in afi-core", () => {
    expect(existsSync(resolve(REPO_ROOT, RETIRED_ORCHESTRATION_PATH))).toBe(false);
  });
});
