<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";
  import { threadListHost } from "../../shared/thread-list.js";

  export const variants = ["all", "no-confirm", "ten", "thousand", "inbox", "nothing-waiting", "archived"];

  const { host, select, newThread, rename, pin, share, remove, loadMore, archive } = threadListHost();

  export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script lang="ts">
  import type { Thread } from "@kind-ui/agent-ui";
  import { untrack } from "svelte";
  import { ThreadList } from "../../../../src/svelte/thread-list/index.js";
  import { expose } from "../../shared/expose.js";
  import {
    archivedThreads,
    doneThreads,
    threads as fixed,
    INBOX_NOW,
    inboxThreads,
    manyThreads,
    NOW,
  } from "../../shared/thread-list.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const inbox = untrack(() => ["inbox", "nothing-waiting", "archived"].includes(variant));
  const initial = untrack(() =>
    variant === "ten"
      ? manyThreads(10)
      : variant === "thousand"
        ? manyThreads(1000)
        : variant === "inbox"
          ? inboxThreads
          : variant === "nothing-waiting"
            ? doneThreads
            : variant === "archived"
              ? archivedThreads
              : fixed,
  );
  let threads = $state.raw(initial);
  let value = $state<string | null>(inbox ? null : (initial[1]?.id ?? null));
  let status = $state<"idle" | "loading" | "error">();

  expose({
    kindHost: host,
    kindThreadList: {
      setThreads: (next: Thread[] | ((threads: Thread[]) => Thread[])) =>
        (threads = typeof next === "function" ? next(threads) : next),
      setValue: (next: string | null) => (value = next),
      setStatus: (next: "idle" | "loading" | "error") => (status = next),
      manyThreads,
    },
  });
</script>

<div class="flex h-[600px] w-[400px] flex-col p-2">
  <ThreadList
    id="threads"
    {threads}
    {value}
    now={inbox ? INBOX_NOW : NOW}
    timeZone="UTC"
    groupBy={inbox ? "status" : undefined}
    view={variant === "archived" ? "archived" : undefined}
    onArchive={inbox ? archive : undefined}
    onUnarchive={inbox ? archive : undefined}
    onSelect={select}
    onNew={newThread}
    onRename={rename}
    onPinChange={pin}
    onShare={share}
    onDelete={remove}
    confirmDelete={variant === "no-confirm" ? false : undefined}
    hasMore={initial.length > 100}
    onLoadMore={loadMore}
    {status}
  />
</div>
