# Contributing

1. Read [AGENTS.md](AGENTS.md), including "Build on UI SDK", and the spec section for the area you change.
2. Build every component on UI SDK: a `definePrimitive` in `packages/agent-ui/src/core/<component>/`, and `createParts` render files. Read the installed UI SDK docs and the `ui-sdk` skill first.
3. Run `npm run check:fast` before pushing. `npm run lint` includes the UI SDK usage guard.
4. Add a changeset (`npm run changeset`) for user-facing changes.

Hand-written focus, keyboard, scroll, or ARIA code is allowed only for the exceptions in spec §2. A new exception needs a spec change first.
