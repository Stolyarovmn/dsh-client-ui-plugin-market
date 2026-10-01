# DSH Web styling rules

[← UI code reference](./README.md)

This page is a compact developer index for the styling contract used by Registry Aggregator. The authority remains upstream DSH `0.1.7-rc.2`:

- [Web UI style reference](https://github.com/deepseek-ai/deepseek-harness/blob/477b4f420553e8a52c2fbccc464d7561b239c443/docs/web-styling.md)
- [Unified corner-radius standard](https://github.com/deepseek-ai/deepseek-harness/blob/477b4f420553e8a52c2fbccc464d7561b239c443/docs/ui-radius.md)
- [ui-theme](https://github.com/deepseek-ai/deepseek-harness/blob/477b4f420553e8a52c2fbccc464d7561b239c443/packages/client/ui-theme)
- [ui-primitives](https://github.com/deepseek-ai/deepseek-harness/blob/477b4f420553e8a52c2fbccc464d7561b239c443/packages/client/ui-primitives)

## Ownership

Feature UI consumes DSH semantic aliases. Shared colors, typography, elevation, motion, gradients, shadows, scrollbar styling, and light/dark behavior belong to `ui-theme`.

Feature code should use `--dsw-alias-*` tokens instead of copying static palette values or literal colors. Theme selectors and palette-specific branches stay out of feature CSS.

## Borders and separators

Flat neutral borders and separators using `--dsw-alias-border-*` draw at **0.5px**. This applies to controls, inputs, cards, row dividers, and ordinary separators.

State-colored borders may remain **1px**. Dashed affordances and explicitly allowlisted drawing details are separate cases.

Elevated menus, popovers, dialogs, panels, and floating controls do **not** combine a neutral border with elevation. They use `border: 0` and the theme-owned elevation material such as `--dsw-elevation-panel` or `--dsw-elevation-prominent`; the elevation shadow already carries its hairline stroke.

## Radius scale

| Role | Typical size / example | Token |
|---|---|---|
| Small detail | below H20 | `--dsw-radius-xs` (R4) |
| Compact control | H20–28 | `--dsw-radius-sm` (R8) |
| Standard control / single-line cell | H32–40 | `--dsw-radius-md` (R12) |
| Large/grouped/multiline content | grouped or deliberately multiline | `--dsw-radius-lg` (R16) |
| Independent content card | settings card, message bubble, guide entry | `--dsw-radius-xl` (R20) |
| Main enclosing surface | dialog, composer, main/floating panel | `--dsw-radius-panel` (R28) |

Concrete native defaults include `Button size="sm"` at H28/R8, `Button size="md"` at H36/R12, standard H32 inputs at R12, and settings/content cards at R20.

Do not invent intermediate ordinary-control radii such as 10px, 14px, 18px, or 24px. Select radius by semantic role, not by incidental width or wrapped label length.

Intentional circles and capsules may use `50%` or `999px`; pair a full-round radius with `corner-shape: round`.

## Settings-card material

The standard settings/plugin card material is:

```css
.card {
  border-radius: var(--dsw-radius-xl);
  border: 0.5px solid var(--dsw-alias-settings-card-stroke);
  background: var(--dsw-alias-settings-card-fill);
}
```

Nested editors/grouped content normally step down to R16 rather than inheriting the outer R20/R28 contour.

## Menus and overlays

Use native `Menu` or `MenuSurface` rather than implementing a parallel dropdown/listbox surface. Menu fill and backdrop filtering are theme-owned and should not be overridden by a feature.

Use native `Modal` for modal behavior and geometry. Do not add another border over its elevation material.

## Colors and gradients

Registry/UI feature code should not own literal palette colors. Use semantic state aliases such as:

```css
var(--dsw-alias-state-success-primary)
var(--dsw-alias-state-warn-primary)
var(--dsw-alias-state-error-primary)
var(--dsw-alias-state-business-primary)
var(--dsw-alias-label-primary)
var(--dsw-alias-label-secondary)
var(--dsw-alias-link)
```

DSH assigns shared gradients to `ui-theme`. A feature should not introduce a decorative product-level gradient merely to imitate the surrounding application. Consume the existing themed surface/fill instead.

## Links

Clickable artifact links use `--dsw-alias-link`, font weight 500, no underline at rest, and a dotted underline with 3px offset on hover/focus.

Known external hosts should use the native `LinkIconRegular/Medium`; DSH already supplies site marks for GitHub, npm, and other known destinations.

## Practical rule for plugins

Before adding feature-owned CSS or SVG:

1. Check whether `ui-primitives` already exports the control or glyph.
2. If the component exists, compose it and restrict local CSS to placement/layout.
3. If no native component exists, use `--dsw-*` tokens and the DSH radius/border rules.
4. Add custom artwork only when the native icon vocabulary lacks the required semantic distinction.
5. Verify normal, hover, active/selected, disabled, keyboard-focus, light/dark, and narrow-layout states visually.

Registry Aggregator currently follows this exception for package updates: DSH `0.1.7-rc.2` has a native single-arrow Refresh glyph but no distinct two-arrow Update/Sync glyph, so package-update actions use one small local current-color SVG while page/content refresh keeps the native Refresh icon.
