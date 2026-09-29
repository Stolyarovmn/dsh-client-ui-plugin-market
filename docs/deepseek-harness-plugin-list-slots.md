# DeepSeek Harness Plugin Manager list-extension proposal

Registry Aggregator can already consume these slots through `ctx.slots.inject()`.
Current DSH 0.1.7-rc.2 does not declare them, so the package keeps its existing
`plugins.bundle.config` UI as a fallback.

## Proposed slots

Add the following root-scoped additive slots to
`@deepseek-ai/dsh-client-ui-plugin-manager`.

```ts
export interface PluginListTabOwnerProps {
  /** Report or clear the small numeric badge rendered after this tab label. */
  readonly setBadge?: (count: number | undefined) => void
}

export interface PluginListActionOwnerProps {
  /** `installed` or the id of a contributed list tab. */
  readonly activeTab: string
  /** Activate the native Installed page or a contributed tab. */
  readonly activateTab: (id: string) => void
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * Additive Plugin Manager list page.
     *
     * Registration uses the standard list options:
     * `id`, `order`, localized `label`.
     *
     * The native Plugin Manager always owns the built-in `installed` page.
     */
    'plugins.list.tab': {
      kind: 'list'
      scope: 'root'
      owner: PluginListTabOwnerProps
    }

    /** Additive controls beside Refresh / Add plugin. */
    'plugins.list.action': {
      kind: 'list'
      scope: 'root'
      owner: PluginListActionOwnerProps
    }
  }
}
```

## Plugin Manager projection

The native list view remains the default and is represented internally by
`installed`. Contributions are projected after it by `order`.

Expected layout:

```text
Plugins                                      refresh   + Add plugin
                                                      + Add source

Installed 2 | Sources | Browse | Updates 3
─────────────────────────────────────────────────────
<active list-page content>
```

Important properties:

- the shipped Installed page stays completely native;
- switching to a contributed tab does not shadow or duplicate
  `main/plugins`;
- visited contributed tabs stay mounted so local search/filter state survives
  tab switching;
- a tab may report an optional numeric badge through `setBadge`;
- actions receive `activeTab` and `activateTab` so an action such as
  `+ Add source` can switch to the Sources tab;
- detail pages keep the existing `plugins.bundle.config` /
  `plugins.detail.*` behavior.

## Suggested PluginManagerPage state

Use the same projection pattern already proven by `settings.plugins.tab`:

```ts
const [activeListTab, setActiveListTab] = useState('installed')
const [visitedListTabs, setVisitedListTabs] = useState<ReadonlySet<string>>(
  () => new Set(['installed']),
)
const [tabBadges, setTabBadges] = useState<Record<string, number | undefined>>({})

const extensionTabs = usePluginListTabs(rows => rows)
const listTabs = [
  { id: 'installed', order: 0, label: t('bundlesTitle') },
  ...extensionTabs,
]
```

Render `plugins.list.action` in the list-page toolbar with:

```ts
renderSlot('plugins.list.action', {
  activeTab: activeListTab,
  activateTab: setActiveListTab,
})
```

Render one selected/visited `plugins.list.tab` contribution with:

```ts
renderSlot('plugins.list.tab', {
  setBadge: count => setTabBadges(current => ({
    ...current,
    [tab.id]: count,
  })),
}, { only: tab.id })
```

## Slot declaration

The `main/plugins` registration should declare both children:

```ts
children: {
  'plugins.list.tab': { kind: 'list', scope: 'root' },
  'plugins.list.action': { kind: 'list', scope: 'root' },
  // existing plugins.* children remain unchanged
}
```

## Registry Aggregator registrations

The current feature branch already registers:

```text
plugins.list.tab
  registry-sources  order 20
  registry-browse   order 30
  registry-updates  order 40

plugins.list.action
  registry-add-source
```

The Updates contribution reports its discovered count through optional
`setBadge`, so the host can render `Updates 3`.

## Backward compatibility

On DSH versions without these slots, `ctx.slots.inject()` simply waits for a
future declaration and Registry Aggregator continues to render through the
existing keyed `plugins.bundle.config` fallback. No DOM patching or page
replacement is required.
