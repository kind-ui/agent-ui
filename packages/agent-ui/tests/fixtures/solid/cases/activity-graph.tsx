import type { JSX } from "@solidjs/web";
import { onSettled } from "solid-js";
import { ActivityGraph } from "../../../../src/solid/activity-graph.js";
import { activityDays, activityHost, activityNow } from "../../shared/activity-graph.js";
import { expose } from "../../shared/expose.js";

const { host, record } = activityHost();

function Host(props: { children: JSX.Element }) {
  onSettled(() => expose({ kindHost: host }));
  return <div class="bg-[var(--kind-color-surface)] p-6">{props.children}</div>;
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
      <div style={{ width: "320px" }}>
        <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" />
      </div>
    </Host>
  ),
  // `?ssr` server-renders and hydrates the whole case, so the hydrated graph sits in the wrapper React's page fills.
  hydrate: () => (
    <div>
      <div id="hydrated">
        <ActivityGraph days={activityDays.slice(7)} timeZone="UTC" weeks={20} />
      </div>
    </div>
  ),
};
