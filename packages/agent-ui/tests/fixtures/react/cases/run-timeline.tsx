import type { RunEvent } from "@kind-ui/agent-ui";
import type { RunTimelineLoadReason } from "@kind-ui/agent-ui/core";
import { useEffect, useRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { RunTimeline } from "../../../../src/react/run-timeline.js";
import { expose } from "../../shared/expose.js";
import { appended, earlier, events as initial } from "../../shared/run-timeline.js";

function Page({ feed = false }: { feed?: boolean }) {
  const [events, setEvents] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(!feed);
  const [loads] = useState<RunTimelineLoadReason[]>([]);
  useEffect(() => {
    expose({
      kindHost: {
        loads,
        append: () => setEvents(appended),
        settle: () => {
          setEvents((current: RunEvent[]) => [earlier, ...current]);
          setHasMore(false);
          setBusy(false);
        },
      },
    });
  }, [loads]);
  return (
    <section id="run-timeline" className="w-[28rem] p-6">
      <RunTimeline
        events={events}
        timeZone="UTC"
        feed={feed}
        order={feed ? "newest-first" : "oldest-first"}
        busy={busy}
        hasMore={hasMore}
        onLoadMore={(details) => {
          loads.push(details.reason);
          setBusy(true);
        }}
      />
    </section>
  );
}

function Hydrated() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = document.createElement("div");
    container.id = "hydrated";
    host.current?.append(container);
    const timeline = <RunTimeline events={initial} timeZone="UTC" />;
    const errors: string[] = [];
    container.innerHTML = renderToString(timeline);
    expose({ kindServerMarkup: container.innerHTML, kindHydrationErrors: errors });
    const root = hydrateRoot(container, timeline, {
      onRecoverableError: (error) => errors.push(String(error)),
    });
    return () =>
      queueMicrotask(() => {
        root.unmount();
        container.remove();
      });
  }, []);
  return <div ref={host} />;
}

export const cases = {
  all: () => <Page />,
  feed: () => <Page feed />,
  hydrate: () => <Hydrated />,
};
