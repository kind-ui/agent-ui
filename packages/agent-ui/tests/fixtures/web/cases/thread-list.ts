import type { Thread } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineThreadList } from "../../../../src/web/thread-list.js";
import { threads as fixed, manyThreads, NOW, threadListHost } from "../../shared/thread-list.js";

const { host, select, newThread, rename, pin, share, remove, loadMore } = threadListHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const threadList =
  ({
    initial,
    confirmDelete,
    status,
  }: {
    initial: Thread[];
    confirmDelete?: boolean;
    status?: "idle" | "loading" | "error";
  }) =>
  (root: HTMLElement) => {
    defineThreadList();
    const container = document.createElement("div");
    container.className = "flex h-[600px] w-[400px] flex-col p-2";
    const list = document.createElement("kind-thread-list");
    list.id = "threads";
    list.threads = initial;
    list.value = initial[1]?.id ?? null;
    list.now = NOW;
    list.timeZone = "UTC";
    if (confirmDelete !== undefined) list.confirmDelete = confirmDelete;
    list.hasMore = initial.length > 100;
    if (status) list.status = status;
    Object.assign(list, {
      canSelect: true,
      canNew: true,
      canRename: true,
      canPin: true,
      canShare: true,
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
  error: threadList({ initial: fixed, status: "error" }),
  ten: threadList({ initial: manyThreads(10) }),
  thousand: threadList({ initial: manyThreads(1000) }),
};
