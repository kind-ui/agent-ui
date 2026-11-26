<script lang="ts">
  import type { DiffFile } from "@kind-ui/agent-ui";
  import type { DiffTarget } from "@kind-ui/agent-ui/core";
  import { Diff } from "@/components/ui/svelte/diff/index.js";

  const changes: DiffFile[] = [
    {
      path: "src/lib/auth/sign-in.ts",
      before: `export async function signIn(email: string, password: string) {
  const user = await db.users.find({ email });
  if (!user) throw new Error("Not found");
  const ok = compare(password, user.hash);
  return { ok, user };
}
`,
      after: `export async function signIn(email: string, password: string) {
  const user = await db.users.find({ email });
  if (!user) return { ok: false, reason: "unknown-user" };
  const ok = await compare(password, user.hash);
  return { ok, user };
}
`,
    },
    {
      path: "src/lib/auth/session.ts",
      status: "added",
      before: "",
      after: `export async function create(userId: string) {
  return db.sessions.insert({ id: crypto.randomUUID(), userId });
}
`,
    },
    {
      path: "src/lib/auth/password.ts",
      oldPath: "src/lib/crypto/password.ts",
      before: "export const rounds = 10;\n",
      after: 'export const rounds = 10;\nexport const algorithm = "argon2id";\n',
    },
  ];

  let files = $state.raw(changes);

  const wait = () => new Promise((resolve) => setTimeout(resolve, 600));

  // The edits are already applied: Keep leaves them, Undo reverts them. Report each decision once it's done.
  const decide =
    (decision: "kept" | "undone") =>
    async ({ path, change }: DiffTarget) => {
      await wait();
      files = files.map((file) => {
        if (path !== undefined && file.path !== path) return file;
        if (file.decision) return file;
        if (change === undefined) return { ...file, decision };
        const decided = [...(file.changes ?? [])];
        decided[change] = { decision };
        return { ...file, changes: decided };
      });
    };
</script>

<div class="flex w-full max-w-2xl flex-col items-start gap-3">
  <Diff
    class="w-full"
    {files}
    defaultOpen={[changes[0].path]}
    onKeep={decide("kept")}
    onUndo={decide("undone")}
  />
  <button type="button" data-kind-button="secondary" onclick={() => (files = changes)}>Start again</button>
</div>
