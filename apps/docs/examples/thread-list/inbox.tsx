"use client";
import type { Thread } from "@kind-ui/agent-ui";
import { useState } from "react";
import { ThreadList } from "@/components/ui/thread-list";

const now = "2026-11-27T12:00:00Z";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

const initialRuns: Thread[] = (
  [
    {
      id: "auth",
      title: "Migrate auth to sessions",
      status: "awaiting-approval",
      waitingSince: ago(12),
      summary: "Run `rm -rf dist`?",
    },
    {
      id: "checkout",
      title: "Fix flaky checkout test",
      status: "awaiting-input",
      waitingSince: ago(8),
      summary: "Which payment provider?",
    },
    {
      id: "react",
      title: "Upgrade to React 20",
      status: "error",
      unread: true,
      updatedAt: ago(2),
      summary: "3 tests failing",
    },
    {
      id: "notes",
      title: "Write release notes",
      status: "running",
      updatedAt: ago(4),
      summary: "Reading `CHANGELOG.md`",
    },
    {
      id: "dark",
      title: "Add dark mode to settings",
      status: "running",
      updatedAt: ago(11),
      summary: "Editing `theme.css` · +48 −6",
    },
    { id: "deps", title: "Bump dependencies", status: "queued" },
    {
      id: "router",
      title: "Refactor the router",
      status: "complete",
      unread: true,
      updatedAt: ago(60),
      summary: "+120 −8 in 4 files · PR #412",
    },
    {
      id: "docs",
      title: "Document the API",
      status: "complete",
      updatedAt: ago(180),
      summary: "Opened PR #415",
    },
    {
      id: "lint",
      title: "Fix lint warnings",
      status: "complete",
      updatedAt: ago(240),
      summary: "+12 −30 in 9 files",
    },
    {
      id: "icons",
      title: "Swap the icon set",
      status: "complete",
      updatedAt: ago(300),
      summary: "Opened PR #409",
    },
  ] satisfies Thread[]
).map((run) => ({ ...run, href: `#${run.id}` }));

export default function ThreadListInboxExample() {
  const [runs, setRuns] = useState(initialRuns);
  const [current, setCurrent] = useState<string | null>(null);
  const update = (id: string, change: Partial<Thread>) =>
    setRuns((list) => list.map((run) => (run.id === id ? { ...run, ...change } : run)));

  return (
    <div style={{ height: "520px", width: "300px" }}>
      <ThreadList
        label="Runs"
        threads={runs}
        value={current}
        now={now}
        groupBy="status"
        onSelect={(id, details) => {
          details.cancel();
          setCurrent(id);
          update(id, { unread: false });
        }}
        onArchive={(id) => update(id, { archived: true })}
        onDelete={(id) => setRuns((list) => list.filter((run) => run.id !== id))}
      />
    </div>
  );
}
