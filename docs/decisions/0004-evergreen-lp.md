# 0004: Evergreen LP (no hardcoded version / license / count)

**Status**: Accepted

## Context

Public assets that are slow or expensive to update (LP HTML, OG image, social previews) accumulate maintenance debt when they hardcode values that change frequently:

- "**21 rules**" in the hero — rule additions force LP edits.
- "v0.9 · MIT" in the OG image footer — every release means re-rendering the image and waiting for social-platform image caches to expire (days to weeks).
- "Rules count: 21" in spec tables — same problem.

These edits aren't hard, but they accumulate friction that discourages frequent releases. Worse, if forgotten, they make the project look stale.

## Decision

Treat every "set-and-forget" public surface as **evergreen**: no hardcoded values that change with releases.

- LP body / hero / CTAs: use generic phrasing ("the full ruleset", "many rules") instead of counts.
- OG image: brand name + tagline + URL only. No version, no license, no rule count.
- Footer copyright: derive the year from `new Date().getFullYear()`.
- README / docs body: counts are fine here (easier to update, version-controlled).

Exceptions:

- Section headings intentionally a snapshot ("Six examples." in the LP's WhatItCatches section — counts what's *on the LP*, not the world).
- Versioned spec tables (Hero's `[rules] 21` is a v0.x snapshot, refreshed with the release cadence).

## Consequences

- **+** No re-rendering OG images on every release.
- **+** No social-platform image cache invalidation pain.
- **+** Friction-free release cadence.
- **−** Slightly less specific copy ("the full ruleset" vs "21 rules"). Mitigated by linking to the full reference in the README and docs.
