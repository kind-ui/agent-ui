import type { DiffDecision, DiffFile } from "@kind-ui/agent-ui";
import type { DiffActionDetails, DiffTarget } from "@kind-ui/agent-ui/core";

const lines = (count: number, line: (i: number) => string) =>
  `${Array.from({ length: count }, (_, i) => line(i + 1)).join("\n")}\n`;

const signInBefore = `import { db } from "../db";
import { compare } from "./hash";
import type { Result } from "./types";

// Signs a person in with their email and password.
//
// Returns why it failed, so the form can say so.
//
// The session is created only once the password matches.
//
// Rate limits live in the route, not here.
//
// Keep this file free of framework imports.
//
//
//
//
//
export async function signIn(email: string, password: string) {
  const user = await db.users.find({ email });
  if (!user) throw new Error("Not found");
  const ok = compare(password, user.hash);
  if (!ok) return { ok: false, reason: "bad-password" };

  // Older accounts keep their hash until they sign in.
  if (user.legacy) {
    await db.users.update(user.id, { legacy: false });
  }

  // Clear any failed attempts.
  await db.attempts.clear(user.id);

  // Sessions last a week.
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const session = await sessions.create(user.id);
  return { ok: true, session };
}
`;

const signInAfter = signInBefore
  .replace(
    '  if (!user) throw new Error("Not found");\n',
    '  if (!user) return { ok: false, reason: "unknown-user" };\n',
  )
  .replace(
    "  const ok = compare(password, user.hash);\n",
    "  const ok = await verify(user.hash, password);\n",
  )
  .replace(
    "  const session = await sessions.create(user.id);\n",
    '  const session = await sessions.create(user.id);\n  audit.log("sign-in", { userId: user.id });\n',
  );

const sessionAfter = lines(38, (i) =>
  i === 1
    ? 'import { randomUUID } from "node:crypto";'
    : i === 3
      ? "export async function create(userId: string) {"
      : i === 4
        ? "  const id = randomUUID();"
        : i === 5
          ? "  await db.sessions.insert({ id, userId, createdAt: new Date() });"
          : i === 38
            ? "}"
            : i === 2
              ? ""
              : `  // step ${i}`,
);

const pageBefore = lines(40, (i) => `  <Field name="field-${i}" />`);
const pageAfter = pageBefore
  .split("\n")
  .flatMap((line, i) =>
    i === 10
      ? [line, ...Array.from({ length: 76 }, (_, j) => `  <Row index={${j}} />`)]
      : i >= 20 && i < 26
        ? []
        : [line],
  )
  .join("\n");

export const files = {
  signIn: { path: "src/lib/auth/sign-in.ts", before: signInBefore, after: signInAfter, language: "ts" },
  session: {
    path: "src/lib/auth/session.ts",
    status: "added",
    before: "",
    after: sessionAfter,
    language: "ts",
  },
  page: {
    path: "src/routes/(app)/settings/security/page.tsx",
    before: pageBefore,
    after: pageAfter,
    language: "tsx",
  },
  password: {
    path: "src/lib/auth/password.ts",
    oldPath: "src/lib/crypto/password.ts",
    before: "export const rounds = 10;\nexport const pepper = env.PEPPER;\n",
    after:
      'export const rounds = 10;\nexport const pepper = env.PEPPER;\nexport const algorithm = "argon2id";\n\n',
    language: "ts",
  },
  packageJson: {
    path: "package.json",
    patch: `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -12,3 +12,3 @@
     "test": "vitest run",
-    "lint": "eslint .",
+    "lint": "biome check .",
     "build": "tsc -b"
`,
  },
  binary: {
    path: "public/og-image.png",
    patch:
      "diff --git a/public/og-image.png b/public/og-image.png\nBinary files a/public/og-image.png and b/public/og-image.png differ\n",
  },
} satisfies Record<string, DiffFile>;

export const run: DiffFile[] = [files.signIn, files.session, files.page, files.password];

/** The patch of `session.ts` as it streams: its first `count` lines. */
export const streamedSession = (count: number): DiffFile => ({
  path: files.session.path,
  status: "added",
  streaming: true,
  patch: `--- /dev/null\n+++ b/${files.session.path}\n@@ -0,0 +1,38 @@\n${sessionAfter
    .split("\n")
    .slice(0, count)
    .map((line) => `+${line}`)
    .join("\n")}\n`,
});

/** Each static frame of the mockups: an id, its files and what's open. */
export const frames: { id: string; label?: string; files: DiffFile[]; open?: string[] }[] = [
  { id: "ready", files: run, open: [files.signIn.path] },
  {
    id: "partly",
    files: [
      { ...files.signIn, changes: [{ decision: "undone" }] },
      { ...files.session, decision: "kept" },
      files.page,
      files.password,
    ],
    open: [files.signIn.path],
  },
  {
    id: "reviewed",
    files: run.map((file, i) => ({ ...file, decision: i === 2 ? "undone" : "kept" })),
  },
  {
    id: "streaming",
    files: [{ ...files.signIn, streaming: false }, streamedSession(6)],
    open: [files.session.path],
  },
  { id: "single", files: [files.packageJson] },
  { id: "binary", files: [files.binary] },
];

/** A big file, `count` lines long with a change every 20 lines, for budgets. */
export const bigPatch = (count: number, extra = 0): DiffFile => {
  const body: string[] = [];
  for (let i = 1; i <= count; i++) body.push(i % 20 === 0 ? `+line ${i} changed` : ` line ${i}`);
  for (let i = 0; i < extra; i++) body.push(`+streamed ${i}`);
  const added = body.filter((line) => line.startsWith("+")).length;
  return {
    path: "src/big.ts",
    streaming: true,
    patch: `--- a/src/big.ts\n+++ b/src/big.ts\n@@ -1,${count - Math.floor(count / 20)} +1,${count - Math.floor(count / 20) + added} @@\n${body.join("\n")}\n`,
  };
};

/** Each call a host's `onKeep` or `onUndo` got. */
export type DiffCall = DiffTarget & { action: "keep" | "undo"; reason: string; source: string };

export type DiffHandle = {
  calls: DiffCall[];
  /** Resolves the oldest pending call. */
  resolve(): void;
  /** Rejects the oldest pending call. */
  reject(): void;
  /** Reports a decision, as a host does once it applied one. */
  decide(path: string, decision: DiffDecision, change?: number): void;
  setFiles(files: DiffFile[]): void;
  opens: { open: string[]; reason: string }[];
};

/**
 * The host every layer's live page runs: `onKeep` and `onUndo` record each call and wait for the test to settle it,
 * and `decide` writes the decision into the files as a host would.
 */
export function createDiffHost(get: () => DiffFile[], set: (files: DiffFile[]) => void) {
  const pending: { resolve: () => void; reject: () => void }[] = [];
  const handle: DiffHandle = {
    calls: [],
    resolve: () => pending.shift()?.resolve(),
    reject: () => pending.shift()?.reject(),
    decide: (path, decision, change) =>
      set(
        get().map((file) => {
          if (file.path !== path) return file;
          if (change === undefined) return { ...file, decision };
          const changes = [...(file.changes ?? [])];
          changes[change] = { decision };
          return { ...file, changes };
        }),
      ),
    setFiles: set,
    opens: [],
  };
  const call = (action: "keep" | "undo") => (target: DiffTarget, details: DiffActionDetails) => {
    handle.calls.push({ action, ...target, reason: details.reason, source: details.source });
    return new Promise<void>((resolve, reject) =>
      pending.push({ resolve, reject: () => reject(new Error("x")) }),
    );
  };
  return {
    handle,
    onKeep: call("keep"),
    onUndo: call("undo"),
    onOpenChange: (open: string[], details: { reason: string }) =>
      handle.opens.push({ open, reason: details.reason }),
  };
}
