import type { Thread } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, onSettled } from "solid-js";
import { ThreadList } from "../../../../src/solid/thread-list.js";
import { expose } from "../../shared/expose.js";
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

function Threads(props: { initial: Thread[]; confirmDelete?: boolean; inbox?: boolean; view?: "archived" }) {
  const [threads, setThreads] = createSignal(props.initial);
  const [value, setValue] = createSignal<string | null>(props.inbox ? null : (props.initial[1]?.id ?? null));
  const [loadStatus, setLoadStatus] = createSignal<"idle" | "loading" | "error">();
  onSettled(() =>
    expose({
      kindHost: host,
      kindThreadList: { setThreads, setValue, setStatus: setLoadStatus, manyThreads },
    }),
  );
  return (
    <div class="flex h-[600px] w-[400px] flex-col p-2">
      <ThreadList
        id="threads"
        threads={threads()}
        value={value()}
        now={props.inbox ? INBOX_NOW : NOW}
        timeZone="UTC"
        groupBy={props.inbox ? "status" : undefined}
        view={props.view}
        onArchive={props.inbox ? archive : undefined}
        onUnarchive={props.inbox ? archive : undefined}
        onSelect={select}
        onNew={newThread}
        onRename={rename}
        onPinChange={pin}
        onShare={share}
        onDelete={remove}
        confirmDelete={props.confirmDelete}
        hasMore={props.initial.length > 100}
        onLoadMore={loadMore}
        status={loadStatus()}
      />
    </div>
  );
}

export const cases = {
  all: () => <Threads initial={fixed} />,
  "no-confirm": () => <Threads initial={fixed} confirmDelete={false} />,
  ten: () => <Threads initial={manyThreads(10)} />,
  thousand: () => <Threads initial={manyThreads(1000)} />,
  inbox: () => <Threads initial={inboxThreads} inbox />,
  "nothing-waiting": () => <Threads initial={doneThreads} inbox />,
  archived: () => <Threads initial={archivedThreads} inbox view="archived" />,
};
