# Registry Aggregator for DeepSeek Harness

This repository is being reorganized for the DSH 0.2.x plugin architecture.

## Branch policy

- `main` — neutral project landing branch. It intentionally contains no installable plugin package or legacy runtime implementation.
- `dsh-0.2.0` — active development line targeting DSH `v0.2.0-rc.2` and newer compatible 0.2.x releases. No backward compatibility with DSH 0.1.x is carried into this branch.
- `dsh-0.1.7` — historical/maintenance line for DSH 0.1.7.x. The preserved stable baseline is Registry Aggregator `v0.4.17`, tested with DSH `0.1.7-rc.2`.
- `dsh-0.1.5` — historical compatibility line for DSH `0.1.5-rc.3`.

Published releases and tags remain the authoritative snapshots for released versions.

## Development policy

For each DSH target, use the `cordis-plugin-development` skill, references, templates, live Slots/Theme inspection, and native Harness UI from that exact DSH version. Do not carry old Client API workarounds or visual assumptions into a newer DSH release without re-verification.

Do not install the plugin from `main`. Use the branch or published release that matches the target DSH version.
