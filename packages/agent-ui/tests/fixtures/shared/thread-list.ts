import type { Thread } from "@kind-ui/agent-ui";

export const NOW = "2026-11-18T12:00:00Z";

export const threads: Thread[] = [
  { id: "t1", title: "Release checklist", updatedAt: "2026-11-10T09:00:00Z", pinned: true, href: "#t1" },
  {
    id: "t2",
    title: "Fix the login redirect",
    updatedAt: "2026-11-18T10:30:00Z",
    href: "#t2",
    status: "running",
  },
  { id: "t3", title: "Draft the launch post", updatedAt: "2026-11-18T08:00:00Z", href: "#t3", unread: true },
  { id: "t4", title: "Atlas roadmap", updatedAt: "2026-11-18T07:00:00Z", group: "Atlas", href: "#t4" },
  { id: "t5", title: "Why the build is slow", updatedAt: "2026-11-17T16:00:00Z", href: "#t5" },
  { id: "t6", title: "Plan the offsite", updatedAt: "2026-11-14T12:00:00Z", href: "#t6", status: "error" },
];

/** The inbox of background runs, grouped by status, at `INBOX_NOW`. */
export const INBOX_NOW = "2026-11-27T12:00:00Z";
const ago = (minutes: number) => new Date(Date.parse(INBOX_NOW) - minutes * 60_000).toISOString();

const doneRuns = (count: number, from = 0): Thread[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `d${from + index}`,
    title: `Finished run ${from + index + 1}`,
    status: "complete",
    updatedAt: ago(180 + (from + index) * 60),
    summary: "Opened a pull request",
    href: `#d${from + index}`,
  }));

export const inboxThreads: Thread[] = [
  {
    id: "r1",
    title: "Migrate auth to sessions",
    status: "awaiting-approval",
    waitingSince: ago(12),
    updatedAt: ago(30),
    summary: "Run `rm -rf dist`?",
    href: "#r1",
  },
  {
    id: "r2",
    title: "Fix flaky checkout test",
    status: "awaiting-input",
    waitingSince: ago(8),
    updatedAt: ago(20),
    summary: "Which payment provider?",
    href: "#r2",
  },
  {
    id: "r3",
    title: "Upgrade to React 20",
    status: "error",
    unread: true,
    waitingSince: ago(2),
    updatedAt: ago(2),
    summary: "3 tests failing",
    href: "#r3",
  },
  {
    id: "r4",
    title: "Write release notes",
    status: "running",
    updatedAt: ago(4),
    summary: "Reading `CHANGELOG.md`",
    href: "#r4",
  },
  {
    id: "r5",
    title: "Add dark mode to settings",
    status: "running",
    updatedAt: ago(11),
    summary: "Editing `theme.css` · +48 −6",
    href: "#r5",
  },
  { id: "r6", title: "Bump dependencies", status: "queued", href: "#r6" },
  {
    id: "r7",
    title: "Refactor the router",
    status: "complete",
    unread: true,
    updatedAt: ago(60),
    summary: "+120 −8 in 4 files · PR #412",
    href: "#r7",
  },
  ...doneRuns(12),
];

/** Nothing waiting and nothing running: only "Done". */
export const doneThreads: Thread[] = [
  {
    id: "r7",
    title: "Refactor the router",
    status: "complete",
    updatedAt: ago(60),
    summary: "+120 −8 in 4 files · PR #412",
    href: "#r7",
  },
  ...doneRuns(13),
];

export const archivedThreads: Thread[] = [
  { ...doneThreads[0], archived: true } as Thread,
  {
    id: "r8",
    title: "Spike: edge runtime",
    status: "complete",
    archived: true,
    updatedAt: "2026-11-18T09:00:00Z",
    summary: "Stopped after 4 min",
    href: "#r8",
  },
  ...inboxThreads.slice(0, 2),
];

/** `count` threads a minute apart, newest first, all today, then yesterday, then earlier. */
export const manyThreads = (count: number, from = 0): Thread[] =>
  Array.from({ length: count }, (_, index) => {
    const n = from + index;
    return {
      id: `m${n}`,
      title: `Thread ${n + 1}`,
      updatedAt: new Date(Date.parse(NOW) - n * 3_600_000).toISOString(),
      href: `#m${n}`,
    };
  });

type Deferred = { id: string; title?: string; source: string; resolve(): void; reject(): void };

export function threadListHost() {
  const calls: { name: string; id?: string; pinned?: boolean; reason?: string; source?: string }[] = [];
  const renames: Deferred[] = [];
  const deletes: Deferred[] = [];
  const archives: Deferred[] = [];
  const host = { calls, renames, deletes, archives, route: false, permit: false };
  const record = (
    name: string,
    id?: string,
    details?: { reason?: string; source?: string; pinned?: boolean },
  ) =>
    calls.push({
      name,
      ...(id !== undefined && { id }),
      ...(details?.pinned !== undefined && { pinned: details.pinned }),
      ...(details?.reason !== undefined && { reason: details.reason }),
      ...(details?.source !== undefined && { source: details.source }),
    });
  return {
    host,
    select: (id: string, details: { reason: string; source?: string; cancel(): void }) => {
      record("select", id, details);
      if (host.route) details.cancel();
    },
    newThread: (details: { source: string }) => record("new", undefined, details),
    rename: (id: string, details: { title: string; source: string }) =>
      new Promise<void>((resolve, reject) =>
        renames.push({ id, title: details.title, source: details.source, resolve, reject }),
      ),
    pin: (id: string, details: { reason: string; source?: string; pinned: boolean }) =>
      record("pin", id, details),
    share: (id: string, details: { reason: string; source?: string }) => record("share", id, details),
    remove: (id: string, details: { source: string }) =>
      new Promise<void>((resolve, reject) => deletes.push({ id, source: details.source, resolve, reject })),
    loadMore: (details: { reason: string }) => record("loadMore", undefined, details),
    archive: (id: string, details: { source: string }) =>
      new Promise<void>((resolve, reject) => archives.push({ id, source: details.source, resolve, reject })),
  };
}
