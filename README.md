# Registry Aggregator for DeepSeek Harness

Registry Aggregator is a federated plugin-discovery layer for DeepSeek Harness. It combines multiple plugin registries, repositories, and JSON catalogs into one normalized index while leaving installation, enable/disable, and removal to the native DSH Plugin Manager.

## Features

- **Sources** — connect, enable, disable, share, remove, and health-check plugin sources.
- **Browse** — search all enabled sources as one deduplicated index.
- **Evidence** — display release channel, GitHub stars, npm 30-day downloads, freshness, source ratings, and declared DSH compatibility when available.
- **Filters** — stable releases, age, category, and DSH metadata.
- **Multi-sort** — combine Stars, Downloads, Freshness, and Name; each criterion can be ascending or descending, and activation order defines priority.
- **Pagination** — 20, 50, or 100 items per page with numbered navigation above and below results.
- **Install** — one-click installation through the native DSH Plugin Manager Host API.
- **Fallback command** — every installable result keeps its `dsh plugin add …` command for manual use.

## Architecture

```text
Plugins → Installed → @stolyarovmn/dsh-ui-registry-aggregator
  ├─ Sources / Browse UI
  ├─ ctx.configForms → source configuration
  ├─ authenticated Connection RPC (/api/plugin-sources/*)
  │    └─ Host adapters
  │         └─ normalize → deduplicate → filter → sort → paginate
  └─ ctx.remote.pluginManager
       ├─ inspect(spec)
       └─ installBundle(spec)
```

The browser does not fetch arbitrary catalog URLs directly. External source access happens on the Host side through the DSH Connection RPC boundary.

## Install

From GitHub:

```sh
dsh plugin --profile web add https://github.com/Stolyarovmn/dsh-ui-registry-aggregator
```

After the npm package is published:

```sh
dsh plugin --profile web add @stolyarovmn/dsh-ui-registry-aggregator
```

Enable the bundle, then open:

```text
Plugins → Installed → @stolyarovmn/dsh-ui-registry-aggregator
```

npm and GitHub sources are added automatically on first use.

## Source types

| Type | Behavior |
| --- | --- |
| `npm` | npm registry discovery using DSH-related keywords. |
| `github` | GitHub repository discovery using DSH-related topics. |
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

The order in which criteria are enabled defines their priority. For example:

```text
1 Freshness ↓
2 Downloads ↓
3 Stars ↓
```

means newest releases first, then higher downloads, then higher stars for ties.

## Compatibility

- DSH: `>=0.1.7-rc.1 <0.2.0`
- Tested with DSH `0.1.7-rc.1`

Exact package compatibility is read from the package metadata when the publisher declares it. Installation is validated again by the native DSH Plugin Manager.

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
