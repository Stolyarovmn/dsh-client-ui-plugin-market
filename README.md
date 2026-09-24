# Plugin Sources for DeepSeek Harness

A federated plugin-discovery layer for DeepSeek Harness. On DSH 0.1.7+ it lives inside the native **Plugins** page as the configuration surface of this installed bundle.

- **Sources** — connect, enable, disable, share, remove, and health-check catalog sources.
- **Browse** — search enabled sources as one normalized, deduplicated index, compare release/popularity evidence, keep the `dsh plugin add …` fallback command, or install through the native DSH Plugin Manager Host API.

This package is not another standalone plugin manager. Marketplaces, registries, repositories, and private catalogs are source types behind one Host-side adapter contract.

## Architecture

\`\`\`text
Plugins → Installed → @stolyarovmn/dsh-client-ui-plugin-market
  ├─ plugins.bundle.config (native DSH Plugin Manager detail page)
  ├─ ctx.configForms → durable source configuration
  ├─ authenticated Connection RPC (/api/plugin-sources/*)
  │    └─ Host adapters → external catalogs
  │         └─ normalize → deduplicate → search → source attribution
  └─ ctx.remote.pluginManager
       ├─ inspect(spec)
       └─ installBundle(spec, { activate: false })
\`\`\`

The browser never fetches arbitrary catalog URLs. The Host registers the public DSH generic Connection RPC seam, which inherits the platform Host/Origin fence and browser-session authentication. Catalog results and health are transient RPC values and are not written to `settings.yaml`.

## Install

```sh
dsh plugin add @stolyarovmn/dsh-client-ui-plugin-market
```

Restart or refresh the Web profile as required by your DSH installation, open **Plugins → Installed**, then open this bundle.

The 0.3.x line targets DSH `>=0.1.7-rc.1 <0.2.0`. Source settings use the shared `configForms` service and the UI registers into the native `plugins.bundle.config` slot. Installation uses DSH's own `remote.pluginManager` Host API; the copied `dsh plugin add …` command remains available as a fallback.

## Source types

| Type | Behavior |
| --- | --- |
| `dsh-plugin-shop` | JSON catalog adapter for a dsh-plugin-shop endpoint supplied in `url`. |
| `dshplugin-app` | JSON catalog adapter for a dshplugin.app-compatible endpoint supplied in `url`. |
| `npm` | npm registry discovery across `dsh-plugin`, `deepseek-harness`, `deepseek-harness-plugin`, and `dsh-plugins`; defaults to `https://registry.npmjs.org/-/v1/search`. |
| `github` | GitHub topic discovery across `dsh-plugin`, `deepseek-harness-plugin`, and `dsh-plugins`; defaults to `https://api.github.com/search/repositories`. |
| `custom-json` | Public JSON catalog. |
| `corporate` | JSON catalog intended for explicitly configured private networks and environment-based auth. |

`npm` and `github` may override their API URL. Discovery aliases are queried independently and deduplicated by package/repository identity. Category-specific topics such as `dsh-plugin-market` or `dsh-plugin-theme` are intentionally not hardcoded as primary discovery signals; plugin repositories should also advertise a general plugin topic. Other JSON-backed adapters require a URL.

### JSON catalog shape

A catalog may be a bare array or an object containing `plugins`, `items`, or `results`:

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
      },
      "evidence": {
        "verified": true,
        "compatibility": "dsh >=0.1.5"
      }
    }
  ]
}
```

Identity precedence is npm package, canonical repository URL, then `source-id:source-specific-id`. Duplicate records retain all source badges, known versions, and normalized category tags. Browse tags are derived only from explicit catalog metadata such as npm keywords, GitHub topics, or catalog category fields; descriptions are not guessed. npm install specs are preferred when merged records offer both npm and git installs.

## Authentication and private registries

Browser-editable settings never select or contain credentials. An operator may map a specific source id to a specific Host environment variable in Cordis config (see below). The Host resolves only that allowlisted mapping and never returns its value to the browser.

Authenticated requests require HTTPS and cannot redirect to another origin. Private, loopback, link-local, multicast, reserved, and other non-global-unicast destinations are blocked by default. An operator must add a trusted source id to Host config `privateSourceIds` before that source may reach a private network; browser settings cannot grant this permission.

Host protections include:

- HTTP(S)-only URLs and no URL-embedded credentials;
- global-unicast address classification and DNS pinning in the actual connection;
- destination revalidation for every redirect;
- one end-to-end deadline covering DNS, redirects, headers, and body;
- redirect, source, concurrency, response-byte, per-source-result, aggregate-result, and RPC-size limits;
- malformed JSON and non-success HTTP containment per source;
- shell-metacharacter filtering and HTTPS-only git install specs.

The Install action and copied command both install third-party code. Review its source and package before running it. A failed source produces health/error data and zero results; no sample or synthetic plugins are injected.

## Host configuration

The Cordis entry accepts optional limits:

```yaml
- id: plugin-market
  name: '@stolyarovmn/dsh-client-ui-plugin-market'
  config:
    timeoutMs: 10000
    maxResponseBytes: 2097152
    maxPlugins: 500
    maxSources: 20
    maxTotalPlugins: 1000
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

The package advertises the `dsh-plugin` keyword and `dsh.catalog` metadata so community catalogs can discover it without inventing a separate manifest format.

The tests cover manifest wiring, client registration and scenarios, adapters, malformed/unavailable sources, SSRF boundaries, size limits, normalization, identity precedence, deduplication, search, and absence of production sample fallback.

## Current scope

Included: source configuration, card-style source management with expandable details, share-to-clipboard, source health, Host-side loading, normalization, deduplication, raw npm text fallback discovery, unified search, source/category tags, package/repository/version details, release-channel badges, GitHub-star evidence, npm 30-day download counts, source ratings when available, zero-value statistics, sorting/filtering, two-line expandable descriptions, direct installation through the native DSH Plugin Manager Host API, and the copy-command fallback.

Installed package enable/disable, uninstall, build-script approval, registry selection, and detailed installation diagnostics remain owned by the native DSH Plugins page.

## License

MIT

## Popularity and release signals

Browse keeps source-provided evidence separate instead of calculating a synthetic score. Versions are classified locally as `stable`, `rc`, `beta`, `alpha`, or generic `prerelease`. GitHub sources contribute star counts, marketplace/custom catalogs may contribute ratings, and npm-backed results are enriched with the public npm downloads API for the last 30 days. Browse displays zero for missing star/download counters so cards remain visually comparable; source-native ratings stay absent when no source provides one.


## Compatibility

- DSH: `>=0.1.7-rc.1 <0.2.0`
- Tested target: DSH `0.1.7-rc.1`
- Previous `0.2.x` releases target the older `0.1.5-rc.3` settings API.

Compatibility is enforced again by the native DSH Plugin Manager during `inspect()` / installation.
