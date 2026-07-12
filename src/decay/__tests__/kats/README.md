# Vendored UWR profile decay KAT vectors — provenance (PR-UWR-KAT-EXEC)

`apply-time-decay.kat.json` in this directory is a **byte-identical vendored
copy** of a governed afi-config artifact. It is test fixture data only: it is
imported exclusively from `src/decay/__tests__/applyTimeDecay.kat.test.ts` and
is never consumed by runtime code.

## Source of truth

| Field | Value |
|---|---|
| Repository | `AFI-Protocol/afi-config` |
| Path | `kats/uwr-profile/v0/apply-time-decay.kat.json` |
| Merge commit (PR #17) | `fe329164919f0c1c9dc24bb5c279978fb680e983` |
| Content commit | `7809af4b0308f7db47488947770a0ab9f236268d` |
| Git blob SHA-1 | `1199f705ee65eef70e6c0c58fffcd10206693cf0` |
| sha256 (file bytes) | `1a1240cc9f8cc8ed70b22f4aa00e7cdfe1176f4f1d3c6b1e10e886b0cfe81b78` |
| Executed against afi-core | `254185381c3c9be91da303454c1f7a27e8818983` (main, PR #16 merge) |
| Profile | `uwr-weighted-lifts-v0.1` (afi-governance `decisions/uwr-profile-pin-v0.1.md`) |

## `engine.sourceCommit 390b440` caveat (pre-delegation pin)

The KAT file pins `engine.sourceCommit: 390b440`, which predates PR #16.
Between `390b440` and the executed-against commit
`254185381c3c9be91da303454c1f7a27e8818983`, `src/decay/GreeksDecayTemplate.ts`
changed in exactly one way: the decay kernel was delegated to afi-math
`decay.remainingAfterHalfLives` (PR #16). That delegation is **proven
bit-exact** against the pre-delegation closed form in
`applyTimeDecay.mathEquivalence.test.ts` (same `Math.pow(0.5, x)` operation,
`Object.is` comparisons), so the pinned vectors describe the executed code's
outputs exactly. The vendored bytes are **not** "corrected" for this — the
stale-looking pin is documented here instead, per change control.

Decay-engine canonicality (UP-8, `math-authority-v0.1.md` §8) **remains
OPEN**; neither the PR #16 delegation nor this KAT execution resolves it. This
file pins the `GreeksDecayTemplate` surface only, as the KAT's own
`engine.canonicalityNote` states.

## Change control

- afi-config is the source of truth; this copy is read-only downstream data.
  Divergence is detected two ways by the test suite: an always-on sha256
  self-integrity check against the pinned constant above, and (on dev machines
  with a sibling `afi-config` checkout) a full byte-compare.
- If either check fails, the vendored copy or the upstream KAT changed. That
  requires a **new scoped authorization** and a deliberate re-vendor with
  updated pins — never silently re-vendor, and never edit the vectors.

## Status and scope

- **testnet-provisional** (the KAT file's own `status`), under
  `x-afiStatus: draft-non-implementation`.
- **Execution ≠ wiring.** These tests execute the KAT vectors against
  `applyTimeDecay` and nothing more. The KAT description's observation that
  base-1 one-half-life rows land on 0.5 (the testnet-provisional
  `minDecayScoreThreshold`, UP-9) stays data commentary: no eligibility gate
  is asserted or wired here, and no reward, mint, or validator-scoring path
  changes. Each follow-up (e.g. PR-UWR-STAMP, any runtime consumption, UP-8
  closure) is separately authorized.
