# Changesets

Every user-facing change to `@kind-ui/agent-ui` adds a changeset: run `npm run changeset`.

Release handoff (spec §9.3):

1. Changesets on `main` open a version PR through `.github/workflows/version.yml`.
2. Merging the version PR runs `.github/workflows/release.yml`, which checks and packs the package, then publishes that exact tarball once a maintainer approves the `npm-release` environment.
3. A maintainer can also run the Release workflow by hand (`workflow_dispatch`) with the `version` in the manifest and a `dist-tag`.

Upgrading any `@ui-sdk/*` package is a separate PR with its own changeset and a full `npm run check`.
