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
| Merge commit (PR #88, DKS-GOV re-vendor) | `36cdc66891f3fe11cd6967ea2a1cee5004bcc5a0` |
| Content commit | `e8d7892` (status flip only; vectors byte-identical to the PR #17 vendoring) |
| Git blob SHA-1 | `8baf7ddeec2efcea21ca5f8fe7e4f4f254629c2b` |
| sha256 (file bytes) | `eb342a9c0a6ae0534c871930724e2b6ac2f5d6ee716699834e71f2a5c15cad1d` |
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

Decay-engine canonicality (UP-8) is **CLOSED by DLC-GOV D-DLC-1**
(`decay-lifecycle-v0.1.md`, accepted 2026-08-24): the minutes-based
exponential half-life law — exactly the `GreeksDecayTemplate.applyTimeDecay`
surface these vectors pin — is the canonical engine.

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
  `x-afiStatus: implemented` — flipped by DKS-GOV D-DKS-1 (accepted
  `defe527`) when DLC-APPLY wired the reactor's serving-path derivation to
  reproduce these vectors bit-exactly in production.
- **Execution ≠ wiring.** These tests execute the KAT vectors against
  `applyTimeDecay` and nothing more. The KAT description's observation that
  base-1 one-half-life rows land on 0.5 (the testnet-provisional
  `minDecayScoreThreshold`, UP-9) stays data commentary: no eligibility gate
  is asserted or wired here, and no reward, mint, or validator-scoring path
  changes. Each follow-up (e.g. PR-UWR-STAMP, any runtime consumption, UP-8
  closure) is separately authorized.
- **DKS-GOV re-vendor (2026-08-24):** the single byte-difference from the
  PR #17 vendoring is the `x-afiStatus` marker (`draft-non-implementation` →
  `implemented`); every vector, expected value, template, and the
  `engine.sourceCommit 390b440` caveat are byte-identical. Pins above
  updated per the change-control rule.
