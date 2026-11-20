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
  const host = { calls, renames, deletes, route: false, permit: false };
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
  };
}
