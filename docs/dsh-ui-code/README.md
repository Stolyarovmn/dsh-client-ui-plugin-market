# DSH UI Code Reference

A docs-only reference for building DSH plugins and extensions that visually and behaviorally match the DeepSeek Harness web client.

> **Source of truth:** upstream DSH. This folder is a pinned developer reference, not a fork of `ui-primitives` and not runtime code for Registry Aggregator.

## Pinned upstream

- Repository: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- Snapshot: [`639ed015397290b3745d163aafe02ffee4aa3f84`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84)
- Shared primitives package: [`packages/client/ui-primitives`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives)
- Package documentation: [`ui-primitives/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/README.md)
- Public exports: [`src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/index.ts)
- Native product icons: [`src/icons/index.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/icons/index.tsx)
- Theme/design tokens: [`packages/client/ui-theme`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-theme)
- Radius/border guidance: [`docs/ui-radius.md`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/ui-radius.md)

## Project UI rule

When building DSH UI:

1. Prefer an exported `@deepseek-ai/dsh-client-ui-primitives` component over recreating the same control.
2. Prefer a native product icon before adding a custom SVG or third-party icon library.
3. Consume `--dsw-*` theme tokens instead of hard-coded product colors, radii, borders, or elevations.
4. Keep accessibility behavior owned by the primitive: labels, focus restoration, keyboard navigation, modal layering, and disabled states should not be reimplemented casually.
5. If DSH has no semantic primitive for a required action, add the smallest local extension and document why the native set was insufficient.
6. Treat this folder as a convenience index. Re-check upstream before introducing a new UI pattern.

## Reference pages

- [Icons](./ICONS.md) — visual catalogue of all 94 native glyph families / 188 Regular + Medium exports.
- [Components](./COMPONENTS.md) — shared controls, overlays, renderers, helpers, artwork families, and source links.

## Important icon convention

The upstream icon set defines:

- Regular stroke: `1px`
- Medium stroke: `1.3px`
- size as a component prop rather than encoding size into the component name
- `currentColor` for the standard product icon set

For package-update UX specifically, the current upstream snapshot has `IconRefreshOutlineRegular/Medium`, but does **not** expose a distinct two-chasing-arrows Sync/Update glyph. In DSH itself, Refresh is used for reload/retry semantics. If an update-specific icon is added locally, keep it visually compatible and separate its meaning from Refresh.

## Updating this reference

When DSH changes, compare the upstream `ui-primitives/src/index.ts`, `icons/index.tsx`, `ui-theme`, and `docs/ui-radius.md`, then regenerate the gallery and update the pinned SHA.
