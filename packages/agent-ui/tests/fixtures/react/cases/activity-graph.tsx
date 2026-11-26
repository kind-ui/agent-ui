import { useEffect, useRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { ActivityGraph } from "../../../../src/react/activity-graph.js";
import { activityDays, activityHost, activityNow } from "../../shared/activity-graph.js";

const { host, record } = activityHost();

function Host({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return <div className="bg-[var(--kind-color-surface)] p-6">{children}</div>;
}

// Server markup ends with the data's last day and today's date in the browser, so it moves as it hydrates.
function Hydrated() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.createElement("div");
    el.id = "hydrated";
    host.current?.append(el);
    const graph = <ActivityGraph days={activityDays.slice(7)} timeZone="UTC" weeks={20} />;
    const errors: string[] = [];
    el.innerHTML = renderToString(graph);
    Object.assign(window, { kindServerMarkup: el.innerHTML, kindHydrationErrors: errors });
    const root = hydrateRoot(el, graph, { onRecoverableError: (error) => errors.push(String(error)) });
    return () =>
      queueMicrotask(() => {
        root.unmount();
        el.remove();
      });
  }, []);
  return <div ref={host} />;
}

export const cases = {
  all: () => (
    <Host>
      <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" onSelect={record} />
    </Host>
  ),
  "read-only": () => (
    <Host>
      <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" />
    </Host>
  ),
  monday: () => (
    <Host>
      <ActivityGraph
        days={activityDays}
        now={activityNow}
        timeZone="UTC"
        weekStart={1}
        weeks={8}
        unit="tokens"
        unitOne="token"
        label="Tokens"
        onSelect={record}
      />
    </Host>
  ),
  rtl: () => (
    <Host>
      <div dir="rtl">
        <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" onSelect={record} />
      </div>
    </Host>
  ),
  narrow: () => (
    <Host>
      <div style={{ width: 320 }}>
        <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" />
      </div>
    </Host>
  ),
  hydrate: () => <Hydrated />,
};
