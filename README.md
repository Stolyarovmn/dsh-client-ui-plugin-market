# Registry Aggregator for DeepSeek Harness

Registry Aggregator is a federated plugin-discovery UI for DeepSeek Harness. It combines trusted plugin registries, GitHub repositories, and compatible JSON catalogs into one normalized index while leaving installation and plugin lifecycle management to the native DSH Plugin Manager.

## Screenshots

### Connected sources

Built-in npm and GitHub sources are health-checked, counted, and managed from the **Sources** view.

![Registry Aggregator — connected sources](docs/screenshots/registry-sources.webp)

### Browse and search

Search across connected sources, filter results, inspect evidence, and install a verified DSH bundle without leaving DeepSeek Harness.

![Registry Aggregator — Browse search](docs/screenshots/registry-browse.webp)

## Highlights

- **Federated Sources** — combine npm, GitHub, and compatible JSON catalogs.
- **Browse** — search all enabled sources as one deduplicated index.
- **Verified DSH bundles** — npm/GitHub candidates are checked for a root `dsh.bundle.patch` before they are exposed as installable results.
- **Evidence** — display release channel, GitHub stars, npm 30-day downloads, freshness, source metadata, and declared DSH compatibility when available.
- **Filters** — stable releases, age, category, and DSH metadata.
- **Multi-sort** — compose Stars, Downloads, Freshness, and Name; each criterion can be ascending or descending.
- **Pagination** — 20, 50, or 100 items per page with navigation above and below results.
- **Native install** — one-click installation through the DSH Plugin Manager Host API.
- **Fallback command** — installable results also expose their `dsh plugin add …` command.
- **Responsive popularity metadata** — missing GitHub star counts are hydrated after Browse renders, so GitHub metadata cannot block the initial search result.

## What's new in 0.4.13

0.4.13 restores the fast, stable Browse/discovery path from the last known-good search implementation and separates GitHub popularity metadata from the critical search path.

- restored npm/GitHub source discovery and source counters;
- restored fast empty-query and keyword Browse behavior;
- kept exact and partial package-name discovery, including scoped npm packages;
- preserved bundle verification before exposing install actions;
- moved missing GitHub star resolution to a separate asynchronous request after cards render;
- star lookups are cached, best-effort, and limited to the visible page;
- a GitHub statistics failure no longer delays or fails Browse.

## Architecture

```text
Plugins → Installed → @stolyarovmn/dsh-ui-registry-aggregator
  ├─ Sources / Browse UI
  ├─ ctx.configForms → source configuration
  ├─ authenticated Connection RPC (/api/plugin-sources/*)
  │    └─ Host adapters
  │         └─ normalize → deduplicate → verify → filter → sort → paginate
  └─ ctx.remote.pluginManager
       ├─ inspect(spec)
       └─ installBundle(spec)
```

The browser does not fetch arbitrary catalog URLs directly. External source access happens on the Host side through the authenticated DSH Connection RPC boundary.

GitHub star enrichment is intentionally separate from the Browse critical path:

```text
Browse request
  → discover / verify / filter / sort / paginate
  → render cards
  → request missing GitHub stars for visible repositories
  → update cards in place
```

## Install

### npm

After the package is published:

```sh
dsh plugin --profile web add @stolyarovmn/dsh-ui-registry-aggregator
```

If you run DSH through `pnpm dlx`:

```sh
pnpm dlx @deepseek-ai/dsh@0.1.7-rc.1 plugin --profile web add @stolyarovmn/dsh-ui-registry-aggregator
```

### GitHub

```sh
pnpm dlx @deepseek-ai/dsh@0.1.7-rc.1 plugin --profile web add "git+https://github.com/Stolyarovmn/dsh-client-ui-plugin-market.git"
```

Enable the installed bundle, then open:

```text
Plugins → Installed → @stolyarovmn/dsh-ui-registry-aggregator
```

npm and GitHub sources are added automatically on first use.

## Source types

| Type | Behavior |
| --- | --- |
| `npm` | npm registry discovery using DSH-related package metadata and keywords. |
| `github` | GitHub repository discovery using DeepSeek-Harness-specific topic intersections. |
| `dsh-plugin-shop` | JSON catalog adapter for a compatible source endpoint. |
| `dshplugin-app` | JSON catalog adapter for a dshplugin.app-compatible endpoint. |
| `custom-json` | Public JSON catalog. |
| `corporate` | JSON catalog with Host-controlled private-network and credential permissions. |

A JSON source may return a bare array or an object containing `plugins`, `items`, or `results`.

Example:

```json
{
  "plugins": [
    {
      "id": "pdf-tools",
      "name": "PDF Tools",
      "description": "Extract and merge PDF documents.",
      "version": "1.2.0",
      "package": "@example/dsh-plugin-pdf",
      "repository": "https://github.com/example/dsh-plugin-pdf",
      "install": {
        "type": "npm",
        "spec": "@example/dsh-plugin-pdf@1.2.0"
      }
    }
  ]
}
```

Identity precedence is npm package, canonical repository URL, then source-specific id. Duplicate records preserve source attribution, versions, and normalized category tags.

## Discovery quality

Registry Aggregator treats registry search hits as **candidates**, not automatically as installable DSH plugins.

- npm candidates are verified against their published package metadata.
- Exact npm package names can be resolved from the registry packument instead of relying only on the eventually-consistent search index.
- Short and partial queries combine cached discovery with query-specific npm/GitHub discovery.
- GitHub discovery uses DeepSeek-Harness-specific topic intersections instead of the broad `dsh-plugin` topic alone.
- npm/GitHub candidates must declare a root `dsh.bundle.patch` before the UI exposes **Install** or the fallback command.
- Candidates that are not valid DSH bundles are removed before totals, sorting, pagination, and rendering.
- npm/GitHub source counters represent verified installable bundle candidates rather than raw keyword/topic cardinality.

## Popularity evidence

- npm download counts come from npm package/download metadata.
- GitHub stars are taken from GitHub discovery when the result already contains them.
- If a visible npm-discovered plugin has a GitHub repository but no star count, the client requests the missing repository statistics **after the Browse result is rendered**.
- Async star lookup is cached and limited to visible results; failures are ignored rather than failing Browse.

## Sorting

Sorting criteria are independent and composable:

- **Stars**
- **Downloads**
- **Freshness**
- **Name**

Clicking a criterion cycles:

```text
off → descending → ascending → off
```

The order in which criteria are enabled defines priority.

## Compatibility

- DSH: `>=0.1.7-rc.1 <0.2.0`
- Tested with DSH `0.1.7-rc.1`

Exact package compatibility is read from package metadata when a publisher declares it. Installation is validated again by the native DSH Plugin Manager.

## Security

Browser-editable source settings never contain credentials.

Host protections include:

- HTTP(S)-only source URLs;
- rejection of URL-embedded credentials;
- blocking of loopback, link-local, private, multicast, reserved, and other non-global-unicast destinations by default;
- DNS pinning and redirect destination revalidation;
- source, response-size, result-count, concurrency, and RPC-size limits;
- Host-controlled allowlists for private sources and environment-based bearer tokens;
- install-spec validation before a command is exposed or sent to the Plugin Manager.

The Install action executes third-party code through the native DSH Plugin Manager. Review the source and package before installation.

## Host configuration

```yaml
- id: registry-aggregator
  name: '@stolyarovmn/dsh-ui-registry-aggregator'
  config:
    timeoutMs: 10000
    maxResponseBytes: 2097152
    maxPlugins: 2000
    maxSources: 20
    maxTotalPlugins: 5000
    maxRpcBytes: 4194304
    concurrency: 4
    privateSourceIds:
      - corporate
    auth:
      - sourceId: corporate
        tokenEnv: DSH_CORPORATE_REGISTRY_TOKEN
```

## Development

```sh
npm install
npm test
npm run test:pack
```

## License

MIT
