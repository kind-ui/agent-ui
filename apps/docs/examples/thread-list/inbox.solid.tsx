import type { Thread } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { ThreadList } from "@/components/ui/solid/thread-list";

const now = "2026-11-18T12:00:00Z";

const initialRuns: Thread[] = (
  [
    {
      id: "auth",
      title: "Refactor the auth module",
      updatedAt: "2026-11-18T11:00:00Z",
      status: "running",
      progress: 0.45,
      summary: "+120 −8 in 4 files",
    },
    {
      id: "billing",
      title: "Migrate the billing tables",
      updatedAt: "2026-11-18T10:00:00Z",
      status: "awaiting-input",
      summary: "Waiting to run 3 migrations",
    },
    {
      id: "changelog",
      title: "Write the changelog",
      updatedAt: "2026-11-18T09:30:00Z",
      status: "complete",
      unread: true,
      summary: "+48 in 1 file",
    },
    { id: "deps", title: "Update dependencies", updatedAt: "2026-11-18T09:00:00Z", status: "queued" },
    {
      id: "checkout",
      title: "Fix the flaky checkout test",
      updatedAt: "2026-11-18T08:00:00Z",
      status: "error",
      summary: "Failed after 3 attempts",
    },
    {
      id: "docs",
      title: "Translate the docs",
      updatedAt: "2026-11-17T18:00:00Z",
      status: "complete",
      summary: "+310 in 12 files",
    },
    { id: "logging", title: "Audit the logging", updatedAt: "2026-11-16T12:00:00Z", status: "complete" },
  ] satisfies Thread[]
).map((run) => ({ ...run, href: `#${run.id}` }));

export default function ThreadListInboxExample() {
  const [runs, setRuns] = createSignal(initialRuns);
  const update = (id: string, change: Partial<Thread>) =>
    setRuns((list) => list.map((run) => (run.id === id ? { ...run, ...change } : run)));

  return (
    <div style={{ height: "420px", width: "300px" }}>
      <ThreadList
        label="Runs"
        threads={runs()}
        now={now}
        groupBy="status"
        groupLabels={{ done: "Finished" }}
        onSelect={(id, details) => {
          details.cancel();
          update(id, { unread: false });
        }}
        onReadChange={(id, { read }) => update(id, { unread: !read })}
        onArchive={(id) => setRuns((list) => list.filter((run) => run.id !== id))}
      />
    </div>
  );
}
