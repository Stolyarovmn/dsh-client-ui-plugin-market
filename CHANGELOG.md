# Changelog

All notable changes to Registry Aggregator are documented here.

## [0.4.17] - 2026-10-01

### Added

- Native plugin update actions for installed bundles and Registry **Updates** cards.
- **Update all** workflow with sequential updates and cancellation of the active/remaining queue.
- Cancel support for individual update operations through the DSH Plugin Manager request id.
- Compact **Add a new source** layout with icon-only cancel/add actions on desktop.

### Changed

- Registry UI controls were aligned more closely with the DSH 0.1.7-rc.2 visual language, including native primitives, semantic theme tokens, DSH radius roles, and 0.5px neutral hairlines.
- Browse cards and artifact links were aligned with native Plugin Manager presentation.
- DSH runtime/client dependencies and CI smoke validation were moved to `0.1.7-rc.2`.
- Package compatibility floor is now `>=0.1.7-rc.2 <0.2.0`.

### Fixed

- Browse results for installed plugins now expose an actionable update instead of a disabled install state.
- Installed update state can be cancelled while the Plugin Manager operation is still cancellable.
- Bulk cancellation stops later queued updates from starting.
- Add Source no longer consumes excessive vertical space.

## [0.4.16] - 2026-09-30

- Integrated Registry Aggregator directly below native **Installed** on the DSH Plugins page.
- Added expandable Installed registry metadata and advisory update badges.
- Added exact installed-package metadata lookup, GitHub star enrichment, compatibility evidence, persisted Browse state, and bounded caches.

Full release details are also kept under [`.github/release-notes/`](.github/release-notes/).
