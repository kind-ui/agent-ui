import { fileURLToPath } from "node:url";

// The checkout a fixture server serves, so a Playwright run reuses only a server from its own worktree.
const root = fileURLToPath(new URL("../../../../", import.meta.url));

export const fixtureIdentity = (name, mode) => `${root}:${name}:${mode}`;

export const identityPath = "/__kind-fixture";

/** Answers `identityPath` with the server's identity. */
export const identityPlugin = (name) => ({
  name: "kind-fixture-identity",
  configureServer(server) {
    const identity = fixtureIdentity(name, server.config.mode);
    server.middlewares.use(identityPath, (_request, response) => response.end(identity));
  },
});
