# DSH ui-primitives component map

[← UI code reference](./README.md)

Canonical export surface: [`packages/client/ui-primitives/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/index.ts)

The upstream package describes itself as Cordis-free React primitives styled through `--dsw-*` tokens. Feature UI should compose these shared atoms instead of creating parallel copies when the existing primitive fits.

## Controls

| Export | Use |
|---|---|
| `Button` | Standard action button; upstream variants include primary, ghost, outline, and toolbar. |
| `Switch` | Two-state toggle. |
| `Checkbox` | Controlled labeled native checkbox. |
| `Input` | Single-line text/search input. |
| `Pill` | Selectable/filter capsule. |
| `Tag` | Read-only status/badge capsule. |
| `SegmentedControl` | Mutually exclusive compact mode switcher. |
| `SegmentedTabs` | Controlled tabs with keyboard navigation. |
| `DisclosureRow` | Shared disclosure/list row pattern. |
| `PathLabel` | File-path presentation. |
| `ShortcutKeys` | Keyboard shortcut display. |

## Menus, overlays, feedback

| Export | Use |
|---|---|
| `Menu`, `MenuItemButton`, `MenuSurface`, `MenuGroup` | Shared menus and grouped menu/list content. |
| `Tooltip` | Hover/focus tooltip. |
| `HoverCard` | Hover preview that remains interactive. |
| `Modal`, `useModalLayer`, `closeTopModal`, `isBehindModal` | Modal layering and focus/escape behavior. |
| `RiskConfirmation` | Explicit confirmation for sensitive actions. |
| `Toast` | Transient system feedback. |
| `ConnectionIndicator`, `StateDot`, `TextShimmer` | Shared state/progress presentation. |
| `ImageLightbox` | Shared image modal. |

## Settings

- `SettingsForm`
- `SettingsValueField`
- `SettingsSecretField`
- `SettingsFormModel`
- `settingsNumberField`
- `settingsTextField`

Use these instead of inventing a second settings form language.

## Agent/tool output renderers

- `JsonTree`, `JsonBlock`
- `MarkdownText`, `MarkdownDelegateProvider`, `CodeBlock`
- `TerminalBlock`
- `ReadBlock`
- `DiffBlock`
- `SearchBlock`
- `WebBlock`

These are intended for untrusted/model-produced content and centralize shared rendering behavior.

## Icons and artwork

Standard product icons:
- [all `icons/*` exports](./ICONS.md)
- [upstream source](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/icons/index.tsx)

Additional families:
- [`PermissionIcon.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/PermissionIcon.tsx)
- [`ReferenceIcon.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/ReferenceIcon.tsx)
- [`LinkIcon.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/LinkIcon.tsx)
- [`FileTypeIcon.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/FileTypeIcon.tsx)
- [`FishLogo.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/FishLogo.tsx)
- [`BrandWordmark.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/BrandWordmark.tsx)
- [`plugin-artwork.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/plugin-artwork.tsx)
- [`guide-artwork.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-primitives/src/guide-artwork.tsx)

## Shared behavior/helpers

The package also exports shared behavior rather than only visual components:

- `useAnchoredMaxHeight`, `useAnchoredPosition`, `useDismissOnOutsidePointer`
- `observeStickyMenuGroups`, `observeComposition`
- `focusWithoutRing`, `pointerModality`
- `writeClipboard`, `fileSizeText`, `relativeTime`, `rankByName`
- `languageForPath`, `CODE_HIGHLIGHT_EXTENSIONS`, `useCodeHighlighter`
- `classifyFileType`, `fileExtension`, `classifyLinkPath`
- `projectUserText`, `extractMarkdownPlainText`

## Theme and geometry

Use the upstream theme aliases rather than local product colors:

- [`ui-theme/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-theme/README.md)
- [`ui-theme/src/styles/base.css`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-theme/src/styles/base.css)
- [`docs/ui-radius.md`](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/ui-radius.md)

The DSH radius guidance distinguishes flat neutral hairline borders from elevated surfaces: elevated menus/popovers/dialogs/panels use the shared elevation material rather than stacking another neutral border on top.

## Source snapshot

Pinned to upstream commit `639ed015397290b3745d163aafe02ffee4aa3f84`. Re-check upstream `src/index.ts` before creating a new shared-looking control.
