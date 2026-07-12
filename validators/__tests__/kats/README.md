# Vendored UWR profile KAT vectors — provenance (PR-UWR-KAT-EXEC)

`compute-uwr-score.kat.json` in this directory is a **byte-identical vendored
copy** of a governed afi-config artifact. It is test fixture data only: it is
imported exclusively from `validators/__tests__/computeUwrScore.kat.test.ts`
and is never consumed by runtime code.

## Source of truth

| Field | Value |
|---|---|
| Repository | `AFI-Protocol/afi-config` |
| Path | `kats/uwr-profile/v0/compute-uwr-score.kat.json` |
| Merge commit (PR #17) | `fe329164919f0c1c9dc24bb5c279978fb680e983` |
| Content commit | `7809af4b0308f7db47488947770a0ab9f236268d` |
| Git blob SHA-1 | `276be9e9348b4e0c2e92e5a9c59d05b50bfeb75d` |
| sha256 (file bytes) | `ff2f63956038b1d5c01109184e2ddddb2606c11405d2420c35b7decb5eb36546` |
| Executed against afi-core | `254185381c3c9be91da303454c1f7a27e8818983` (main, PR #16 merge) |
| Profile | `uwr-weighted-lifts-v0.1` (afi-governance `decisions/uwr-profile-pin-v0.1.md`) |

The KAT file records `engine.sourceCommit: 390b440`. For this file that pin is
exact in substance: `validators/UniversalWeightingRule.ts` is **blob-identical**
between `390b440` and the executed-against commit `254185381c3c9be91da303454c1f7a27e8818983`,
so the pinned commit describes precisely the code these vectors are executed
against.

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
  `computeUwrScore` and nothing more. They do not wire the profile into
  reward, mint, or validator-scoring paths, do not consume any registry at
  runtime, and do not change `defaultUwrConfig`. Each follow-up
  (e.g. PR-UWR-STAMP, any runtime consumption) is separately authorized.
