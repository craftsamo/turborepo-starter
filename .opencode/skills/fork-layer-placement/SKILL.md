---
name: fork-layer-placement
description: Use when deciding WHICH repo/layer of a fork chain a shared change should live in — a new opencode skill, a shared package, a CI workflow, a convention, or a config ("upstream or fork?", "which layer?", "どっちに実装?", "どこに置く?"). Covers building the fork-lineage tree, the owns-it + common-ancestor rule, generic-to-root vs tech-to-its-layer, sibling forks, repo vs global, and the no-duplicate / no-delete-commit migration rule. Trigger keywords: "which repo", "which layer", "where to put", "upstream or fork", "fork chain", "placement", "どっちに実装", "どこに置く".
license: MIT
compatibility: opencode
metadata:
  category: workflow
  package: repo
  stack: git,monorepo,fork-chain
---

<Goal>

Decide which repo/layer of a fork chain a SHARED change should originate in, so it
reaches every fork that needs it without duplication or sync conflicts.

</Goal>

<Scope>

- Applies to **shared changes**: opencode skills, shared packages, CI/workflows,
  conventions, configs — anything multiple forks might inherit.
- NOT app features / layer-specific code: those live in whatever fork uses them
  (placement is obvious — don't over-hoist).
- A "fork chain" = repos linked by `upstream` remotes (this family:
  `turborepo-starter` → `-with-cloudrun` → `-proxy` → `-discordbot`, with
  `-legacy` as a direct sibling of `-with-cloudrun`).
- Pairs with `sync-upstream`: this decides where to ORIGINATE a change;
  `sync-upstream` PROPAGATES it downward.

</Scope>

<Steps>

1. **Build the lineage tree.** For each repo: `git remote get-url upstream` (the
   root has none). Sketch parent → child and note siblings (forks sharing a
   parent).
2. **Classify what the change depends on.**
   - Generic / tech-agnostic, every fork could use it → root-ward.
   - Tied to a capability introduced at layer N (only N + descendants have it) →
     layer N.
   - Personal / machine-specific, not project-shared → global
     `~/.config/opencode/skills/`.
3. **Target layer = the shallowest layer that BOTH (a) owns/contains what the
   change depends on AND (b) is a common ancestor of every repo that needs it.**
   If the needers include a sibling that branches higher, go up to their common
   ancestor.
4. **Repo vs global.** Shared & versioned with the family → the target repo. Pure
   personal cross-repo tooling with no dependency on any repo's code → global.
5. **Place it once, let it propagate.** Add it at the target layer; descendants
   inherit via `sync-upstream`. Do not copy it into multiple layers.

Worked examples:
- `sync-upstream` — generic git procedure every fork needs (incl. the `-legacy`
  sibling) → common ancestor = the root.
- Cloud Run skills — depend on Cloud Run, introduced at `-with-cloudrun` (the root
  and `-legacy` lack it) → that layer, inherited by `-proxy` / `-discordbot`.

</Steps>

<Verify>

Before implementing, confirm the chosen layer:
- **Owns it**: the layer actually introduces/contains what the change depends on.
- **Covers all needers**: every repo that needs it is the chosen layer or
  downstream of it (check siblings!).
- **No duplication**: it doesn't already exist at another layer (would cause
  add/add sync conflicts).
- **Right sharing tier**: repo (shared/versioned) vs global (personal) matches the
  audience.

</Verify>

<AntiPatterns>

- Placing a generic, every-fork capability in a mid-chain layer — siblings that
  branch higher won't inherit it (the `-legacy` trap).
- Duplicating the same file across layers — guarantees add/add conflicts on every
  sync.
- "Moving" something with a delete-commit in a fork — on the next rebase the
  delete removes the inherited copy. Instead add at the correct layer and let the
  redundant copy reconcile via `git rebase --skip` (see `sync-upstream`).
- Putting layer-specific tooling (e.g. Cloud Run) at the generic root — dead
  weight there, irrelevant to siblings.
- Treating app features as "shared" — they belong in the fork that uses them.
- Reaching for global when forks/collaborators need it (or repo when it's purely
  personal cross-chain tooling) — match the tier to the audience.

</AntiPatterns>
