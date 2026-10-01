# Registry Aggregator for DeepSeek Harness 0.2.x

This branch is the clean DSH `0.2.0` implementation line. It does **not** carry compatibility code or UI workarounds from DSH `0.1.x`.

Current test version: `0.5.0-rc.2`  
Target: DSH `v0.2.0-rc.2`

## Current milestone

The native Plugin Manager remains responsible for package lifecycle. Registry Aggregator adds discovery capabilities around it.

Implemented in this milestone:

- native `plugins.bundle.config` integration;
- `Sources | Browse | Updates` navigation;
- live source configuration through the Plugin Manager's `form.state` / `form.mutate` contract;
- built-in npm and GitHub sources;
- custom JSON and corporate catalog sources;
- Host-side health checks and discovered-item counts;
- per-source enable/disable, add, remove, refresh, latency, and error state;
- authenticated Host RPC over the DSH Connection service;
- bounded responses, request timeouts, redirect validation, DNS pinning, and private-network blocking;
- no duplicate `Installed` view;
- no runtime import of Harness Client implementation packages;
- Harness-provided React and DSH theme tokens.

Not migrated yet:

- Browse discovery results, filters, ranking, stars/downloads/freshness;
- compatibility evidence;
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
  ├─ form.state / form.mutate
  │    └─ Host Config.sources
  └─ ctx.connection.rpc.call
       └─ /api/plugin-sources/{health,counts}
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
