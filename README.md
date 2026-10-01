# Registry Aggregator for DeepSeek Harness 0.2.x

This branch is the clean DSH `0.2.0` implementation line. It does **not** carry compatibility code or UI workarounds from DSH `0.1.x`.

Current test version: `0.5.0-rc.1`  
Target: DSH `v0.2.0-rc.2`

## Current milestone

The first milestone is intentionally small and installable:

- native `plugins.bundle.config` integration;
- `Sources | Browse | Updates` navigation;
- no duplicate `Installed` view;
- no runtime import of Harness Client implementation packages;
- Harness-provided React only;
- DSH theme tokens only for ordinary UI styling;
- plugin lifecycle remains owned by the native DSH Plugin Manager.

The source adapters, discovery engine, ranking/evidence, and update orchestration are migrated only after this skeleton is verified in the real DSH `0.2.0-rc.2` UI.

## Architecture direction

```text
DSH Plugins
  └─ Installed
      └─ @stolyarovmn/dsh-ui-registry-aggregator
          └─ plugins.bundle.config
              ├─ Sources
              ├─ Browse
              └─ Updates

Install / enable / disable / uninstall
  └─ native DSH Plugin Manager

Registry Aggregator
  └─ discovery + registry evidence + update discovery
```

## Test from GitHub

Use a commit SHA from this branch rather than publishing a test package:

```powershell
$DSH_VERSION = "0.2.0-rc.2"
$COMMIT = "<commit-sha>"
pnpm dlx "@deepseek-ai/dsh@$DSH_VERSION" plugin --profile registry-test add "github:Stolyarovmn/dsh-ui-registry-aggregator#$COMMIT"
pnpm dlx "@deepseek-ai/dsh@$DSH_VERSION" registry-test
```

Then open **Plugins → Installed → Registry Aggregator** and verify all three tabs in the real Harness UI.

## Historical lines

- `dsh-0.1.7` — stable `v0.4.17` line for DSH `0.1.7-rc.2`.
- `dsh-0.1.5` — historical DSH `0.1.5-rc.3` compatibility line.
- `main` — neutral project landing branch.
