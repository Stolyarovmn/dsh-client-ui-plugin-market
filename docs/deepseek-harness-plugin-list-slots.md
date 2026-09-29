# DeepSeek Harness Plugin Manager list-section proposal

Registry Aggregator can consume one additive Plugin Manager slot while keeping the
current `plugins.bundle.config` page as a fallback.

## Proposed slot

Add one root-scoped list slot to
`@deepseek-ai/dsh-client-ui-plugin-manager`:

```ts
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * Additive content rendered after the native Installed packages list.
     *
     * The native Plugin Manager still owns Official, Installed, Add plugin,
     * install/uninstall, toggles, refresh, and package detail navigation.
     */
    'plugins.list.section': {
      kind: 'list'
      scope: 'root'
      owner: Record<string, never>
    }
  }
}
```

## Intended layout

```text
Plugins                                      refresh   + Add plugin

Official 7
...

Installed 2
─────────────────────────────────────────────────────
@stolyarovmn/dsh-ui-registry-aggregator
@stolyarovmn/dsh-client-ui-schedule-tab

Plugin Registry
Sources   |   Browse   |   Updates 3
─────────────────────────────────────────────────────
<Registry Aggregator content>
```

The Registry Aggregator owns the three tabs inside its section. DSH only provides
the placement point.

## PluginManagerPage change

Extend the page's slot renderer type with `plugins.list.section` and render it
after the native Installed package list while the root list view is active:

```tsx
export type PluginManagerPageProps =
  PropsRuntime<'main'>
  & PropsLocale<'pluginManager'>
  & PropsRenderSlots<
      | 'plugins.item'
      | 'plugins.bundle.config'
      | 'plugins.row.config'
      | 'plugins.bundle.activation'
      | 'plugins.detail.actions'
      | 'plugins.detail.badge'
      | 'plugins.detail.section'
      | 'plugins.list.section'
    >
  & InjectFace<PluginManagerFace>
  & PropsStore<ReturnType<typeof createNavigationStore>>
```

In the root/list view, after the Installed section:

```tsx
{renderSlot('plugins.list.section', {})}
```

No Plugin Manager tab state, action API, badge API, or alternate navigation model
is required.

## Slot declaration

The `main/plugins` registration only needs one additional child:

```ts
children: {
  'plugins.item': { kind: 'list', scope: 'root' },
  'plugins.bundle.activation': { kind: 'keyed', scope: 'root' },
  'plugins.bundle.config': { kind: 'keyed', scope: 'root' },
  'plugins.row.config': { kind: 'keyed', scope: 'root' },
  'plugins.detail.actions': { kind: 'list', scope: 'root' },
  'plugins.detail.badge': { kind: 'list', scope: 'root' },
  'plugins.detail.section': { kind: 'list', scope: 'root' },
  'plugins.list.section': { kind: 'list', scope: 'root' },
}
```

## Registry Aggregator registration

The current feature branch registers exactly one contribution:

```js
ctx.slots.inject("plugins.list.section", () =>
  ctx.slots.register(
    {
      name: "plugins.list.section",
      id: "registry-aggregator",
      order: 20,
      locale: NS,
    },
    RegistryPluginListSection,
  ),
)
```

Inside that section Registry Aggregator renders and persists its own:

```text
Sources | Browse | Updates N
```

The Updates view checks installed bundle versions lazily and only renders packages
for which a newer registry version is available.

## Backward compatibility

On DSH versions without `plugins.list.section`, the injection remains dormant and
Registry Aggregator continues to use its existing keyed
`plugins.bundle.config` fallback.

There is no DOM patching, no replacement of `main/plugins`, and no duplication of
native install/uninstall/toggle behavior.
