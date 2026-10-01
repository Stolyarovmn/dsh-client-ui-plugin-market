# Registry Aggregator for DeepSeek Harness 0.2.x

This branch is the clean DSH `0.2.0` implementation line. It does **not** carry compatibility code or UI workarounds from DSH `0.1.x`.

Current test version: `0.5.0-rc.6`  
Target: DSH `v0.2.0-rc.2`

## Current milestone

The native Plugin Manager remains responsible for package lifecycle. Registry Aggregator adds discovery capabilities around it.

Implemented in this milestone:

- native `plugins.bundle.config` integration;
- `Sources | Browse | Updates` navigation;
- live source configuration through `ctx.configForms.get('registry-aggregator')`; the bundle slot is presentation-only because DSH does not guarantee a single `form` for bundle-wide pages;
- built-in npm and GitHub sources;
- custom JSON and corporate catalog sources;
- Host-side health checks and discovered-item counts;
- per-source enable/disable, add, remove, refresh, copy-address, count, and error state;
- DSH 0.2-native switch geometry and icon-action sizing copied under the plugin namespace;
- authenticated Host RPC over the DSH Connection service;
- bounded responses, request timeouts, redirect validation, DNS pinning, and private-network blocking;
- no duplicate `Installed` view;
- live federated Browse search across enabled npm, GitHub, custom JSON, and corporate sources;
- compact icon-led source/release/freshness/tag/page-size filters, multi-source metadata, and 20/50/100 pagination;
- combinable multi-sort criteria for relevance, stars, downloads, freshness, and name with per-criterion direction and priority;
- npm 30-day download enrichment plus GitHub stars when available; GitHub-only entries intentionally have no npm download count;
- popular/default Browse results when the query is empty;
- real npm/GitHub source marks and a package icon exposed through the DSH 0.2 manifest contract;
- horizontal layout containment for narrow Plugin Manager detail panes;
- no runtime import of Harness Client implementation packages;
- Harness-provided React and DSH theme tokens.

Not migrated yet:

- compatibility evidence and bundle verification in Browse;
- install/update actions from Browse;
- update discovery and Update all.

## Architecture

```text
DSH Plugins
  └─ Installed
      └─ Registry Aggregator
          └─ plugins.bundle.config
              ├─ Sources  ← current milestone
              ├─ Browse
              └─ Updates

Sources UI
  ├─ ctx.configForms.get('registry-aggregator')
  │    ├─ snapshot subscription
  │    └─ form.mutate(...) → Host Config.sources
  └─ ctx.connection.rpc.call
       └─ /api/plugin-sources/{health,counts,browse}
            └─ Host source adapters
                 ├─ npm
                 ├─ GitHub
                 ├─ custom-json
                 └─ corporate

Install / enable / disable / uninstall
  └─ native DSH Plugin Manager
```

## Test from GitHub

Use a commit SHA from this branch rather than publishing a test package:

```powershell
$DSH_VERSION = "0.2.0-rc.2"
$PROFILE = "dsh-020-test"
$COMMIT = "<commit-sha>"
$env:DSH_HOME = "$env:USERPROFILE\.dsh-020-test"

pnpm dlx "@deepseek-ai/dsh@$DSH_VERSION" plugin --profile $PROFILE add "github:Stolyarovmn/dsh-ui-registry-aggregator#$COMMIT"
pnpm dlx "@deepseek-ai/dsh@$DSH_VERSION" --profile $PROFILE
```

Then open **Plugins → Installed → Registry Aggregator → Sources** and verify source state in the real Harness UI.

## Historical lines

- `dsh-0.1.7` — stable `v0.4.17` line for DSH `0.1.7-rc.2`.
- `dsh-0.1.5` — historical DSH `0.1.5-rc.3` compatibility line.
- `main` — neutral project landing branch.
