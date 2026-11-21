import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { ThreadSearch } from "../../../../src/solid/thread-search.js";
import { expose } from "../../shared/expose.js";
import { NOW, results, threadSearchHost, threads } from "../../shared/thread-search.js";

const { host, record } = threadSearchHost();

function Page(props: { motion?: MotionMode; presentation?: "sheet"; refusing?: boolean }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <ThreadSearch
        id="search"
        threads={threads}
        now={NOW}
        timeZone="UTC"
        shortcut="mod+k"
        onSelect={record("select", props.refusing)}
        onNew={record("new")}
        onQueryChange={record("query")}
        motion={props.motion}
        presentation={props.presentation}
      />
    </div>
  );
}

function Server() {
  const [status, setStatus] = createSignal<"idle" | "loading" | "error">("loading");
  onSettled(() => expose({ kindHost: { ...host, setStatus } }));
  return (
    <div class="p-6">
      <ThreadSearch
        id="search"
        threads={results}
        now={NOW}
        filter={false}
        status={status()}
        onSelect={record("select")}
        onQueryChange={record("query")}
      />
    </div>
  );
}

function Owned() {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="p-6">
      <ThreadSearch id="search" threads={threads} now={NOW} query="" onQueryChange={record("query")} />
    </div>
  );
}

export const cases = {
  owned: () => <Owned />,
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  sheet: () => <Page presentation="sheet" />,
  server: () => <Server />,
};
