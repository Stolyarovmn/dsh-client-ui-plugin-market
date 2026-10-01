# Plugin Manager self-embedding strategy

Registry Aggregator is self-contained: installing the plugin is enough to make
its registry section available on the Plugins page.

## Current DSH 0.1.7-rc.2

DSH 0.1.7-rc.2 does not declare an additive slot below the native Installed
package list. Registry Aggregator therefore uses a bounded compatibility bridge:

1. wait for the native Plugins root list to render;
2. find the native Installed group through DSH's existing
   `data-plugin-scope="global" data-plugin-group="bundles"` attributes;
3. insert one dedicated mount element immediately after that group;
4. render the Registry Aggregator section into that element as a separate React
   root;
5. unmount/remove it when the Plugins list disappears;
6. reattach it when the user returns to the Plugins list.

The bridge does **not** replace `main/plugins`, change native package rows, or
intercept install/uninstall/toggle handlers.

Target layout:

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

The internal section tab is persisted by Registry Aggregator. Updates are checked
lazily and the count is rendered by the plugin itself.

## Future native extension point

Registry Aggregator also registers `plugins.list.section` through
`ctx.slots.inject()`.

If a future DSH release declares that slot, the plugin automatically prefers the
native slot and disables the DOM compatibility bridge. No reinstall-time patch or
manual DSH modification is required.

A suitable future declaration would be:

```ts
'plugins.list.section': {
  kind: 'list'
  scope: 'root'
  owner: Record<string, never>
}
```

and PluginManagerPage would render it after the native Installed group.

## Fallback

The existing keyed `plugins.bundle.config` Registry Aggregator UI remains
available as a reserve path, independently of both the DOM bridge and a future
native slot.
