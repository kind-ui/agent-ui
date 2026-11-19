import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ThreadSearch } from "../../../../src/react/thread-search.js";
import { NOW, results, threadSearchHost, threads } from "../../shared/thread-search.js";

const { host, record } = threadSearchHost();

function Page({
  motion,
  presentation,
  refusing,
}: {
  motion?: MotionMode;
  presentation?: "sheet";
  refusing?: boolean;
}) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <ThreadSearch
        id="search"
        threads={threads}
        now={NOW}
        timeZone="UTC"
        shortcut="mod+k"
        onSelect={record("select", refusing)}
        onNew={record("new")}
        onQueryChange={record("query")}
        motion={motion}
        presentation={presentation}
      />
    </div>
  );
}

/** The host searches: its results in its order, and a status it sets. */
function Server() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  useEffect(() => {
    Object.assign(window, { kindHost: { ...host, setStatus } });
  }, []);
  return (
    <div className="p-6">
      <ThreadSearch
        id="search"
        threads={results}
        now={NOW}
        filter={false}
        status={status}
        onSelect={record("select")}
        onQueryChange={record("query")}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  sheet: () => <Page presentation="sheet" />,
  server: () => <Server />,
};
