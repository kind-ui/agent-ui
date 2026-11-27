import type { Thread } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineThreadList } from "../../../../src/web/thread-list.js";
import {
  archivedThreads,
  doneThreads,
  threads as fixed,
  INBOX_NOW,
  inboxThreads,
  manyThreads,
  NOW,
  threadListHost,
} from "../../shared/thread-list.js";

const { host, select, newThread, rename, pin, share, remove, loadMore, archive } = threadListHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const threadList =
  ({
    initial,
    confirmDelete,
    inbox,
    view,
  }: {
    initial: Thread[];
    confirmDelete?: boolean;
    inbox?: boolean;
    view?: "archived";
  }) =>
  (root: HTMLElement) => {
    defineThreadList();
    const container = document.createElement("div");
    container.className = "flex h-[600px] w-[400px] flex-col p-2";
    const list = document.createElement("kind-thread-list");
    list.id = "threads";
    list.threads = initial;
    list.value = inbox ? null : (initial[1]?.id ?? null);
    list.now = inbox ? INBOX_NOW : NOW;
    list.timeZone = "UTC";
    if (inbox) list.groupBy = "status";
    if (view) list.view = view;
    if (confirmDelete !== undefined) list.confirmDelete = confirmDelete;
    list.hasMore = initial.length > 100;
    Object.assign(list, {
      canSelect: true,
      canNew: true,
      canRename: true,
      canPin: true,
      canShare: true,
      canArchive: !!inbox,
      canUnarchive: !!inbox,
      canDelete: true,
      canLoadMore: true,
    });
    list.addEventListener("threadselect", (event) => {
      const { value, ...details } = event.detail;
      select(value, { ...details, cancel: () => event.preventDefault() });
    });
    list.addEventListener("threadnew", (event) => newThread(event.detail.value));
    list.addEventListener("threadrename", (event) => {
      const { value, waitUntil, ...details } = event.detail;
      waitUntil(rename(value, details));
    });
    list.addEventListener("pinchange", (event) => {
      const { value, ...details } = event.detail;
      pin(value, details);
    });
    list.addEventListener("threadshare", (event) => {
      const { value, ...details } = event.detail;
      share(value, details);
    });
    list.addEventListener("threaddelete", (event) => {
      const { value, waitUntil, ...details } = event.detail;
      waitUntil(remove(value, details));
    });
    list.addEventListener("loadmore", (event) => loadMore(event.detail));
    for (const type of ["threadarchive", "threadunarchive"] as const)
      list.addEventListener(type, (event) => {
        const { value, waitUntil, ...details } = event.detail;
        waitUntil(archive(value, details));
      });
    container.append(list);
    root.append(container);
    Object.assign(window, {
      kindHost: host,
      kindThreadList: {
        setThreads: (update: Thread[] | ((threads: Thread[]) => Thread[])) => {
          list.threads = typeof update === "function" ? update(list.threads ?? []) : update;
        },
        setValue: (value: string | null) => {
          list.value = value;
        },
        setStatus: (next: "idle" | "loading" | "error" | undefined) => {
          list.status = next;
        },
        manyThreads,
      },
    });
  };

export const cases = {
  all: threadList({ initial: fixed }),
  "no-confirm": threadList({ initial: fixed, confirmDelete: false }),
  ten: threadList({ initial: manyThreads(10) }),
  thousand: threadList({ initial: manyThreads(1000) }),
  inbox: threadList({ initial: inboxThreads, inbox: true }),
  "nothing-waiting": threadList({ initial: doneThreads, inbox: true }),
  archived: threadList({ initial: archivedThreads, inbox: true, view: "archived" }),
};
