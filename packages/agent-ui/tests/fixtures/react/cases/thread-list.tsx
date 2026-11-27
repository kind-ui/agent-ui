import type { Thread } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { ThreadList } from "../../../../src/react/thread-list.js";
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

function Threads({
  initial,
  confirmDelete,
  inbox,
  view,
}: {
  initial: Thread[];
  confirmDelete?: boolean;
  inbox?: boolean;
  view?: "archived";
}) {
  const [threads, setThreads] = useState(initial);
  const [value, setValue] = useState<string | null>(inbox ? null : (initial[1]?.id ?? null));
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "error">();
  useEffect(() => {
    Object.assign(window, {
      kindHost: host,
      kindThreadList: { setThreads, setValue, setStatus: setLoadStatus, manyThreads },
    });
  }, []);
  return (
    <div className="flex h-[600px] w-[400px] flex-col p-2">
      <ThreadList
        id="threads"
        threads={threads}
        value={value}
        now={inbox ? INBOX_NOW : NOW}
        timeZone="UTC"
        groupBy={inbox ? "status" : undefined}
        view={view}
        onArchive={inbox ? archive : undefined}
        onUnarchive={inbox ? archive : undefined}
        onSelect={select}
        onNew={newThread}
        onRename={rename}
        onPinChange={pin}
        onShare={share}
        onDelete={remove}
        confirmDelete={confirmDelete}
        hasMore={initial.length > 100}
        onLoadMore={loadMore}
        status={loadStatus}
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
