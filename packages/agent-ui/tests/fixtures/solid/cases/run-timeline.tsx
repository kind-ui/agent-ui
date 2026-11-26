import type { RunEvent } from "@kind-ui/agent-ui";
import type { RunTimelineLoadReason } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { RunTimeline } from "../../../../src/solid/run-timeline.js";
import { expose } from "../../shared/expose.js";
import { appended, earlier, events as initial } from "../../shared/run-timeline.js";

function Page(props: { feed?: boolean }) {
  const feed = props.feed ?? false;
  const [events, setEvents] = createSignal(initial);
  const [busy, setBusy] = createSignal(false);
  const [hasMore, setHasMore] = createSignal(!feed);
  const loads: RunTimelineLoadReason[] = [];
  onSettled(() =>
    expose({
      kindHost: {
        loads,
        append: () => {
          setEvents(appended);
        },
        settle: () => {
          setEvents((current: RunEvent[]) => [earlier, ...current]);
          setHasMore(false);
          setBusy(false);
        },
      },
    }),
  );
  return (
    <section id="run-timeline" class="w-[28rem] p-6">
      <RunTimeline
        events={events()}
        timeZone="UTC"
        feed={feed}
        order={feed ? "newest-first" : "oldest-first"}
        busy={busy()}
        hasMore={hasMore()}
        onLoadMore={(details) => {
          loads.push(details.reason);
          setBusy(true);
        }}
      />
    </section>
  );
}

export const cases = {
  all: () => <Page />,
  feed: () => <Page feed />,
};
