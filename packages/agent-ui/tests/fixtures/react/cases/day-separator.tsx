import { useEffect, useRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { DaySeparator } from "../../../../src/react/day-separator.js";

function Hydrated() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = document.createElement("div");
    container.id = "hydrated";
    host.current?.append(container);
    const separator = <DaySeparator date="2026-11-18T09:30:00Z" timeZone="UTC" />;
    const errors: string[] = [];
    container.innerHTML = renderToString(separator);
    Object.assign(window, { kindServerMarkup: container.innerHTML, kindHydrationErrors: errors });
    const root = hydrateRoot(container, separator, {
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
  all: () => (
    <div className="flex flex-col gap-3 p-6">
      <DaySeparator id="today" date="2026-11-18T09:30:00Z" timeZone="UTC" />
      <DaySeparator id="yesterday" date="2026-11-17T09:30:00Z" timeZone="UTC" />
      <DaySeparator id="weekday" date="2026-11-13T09:30:00Z" timeZone="UTC" />
      <DaySeparator id="older" date="2026-10-02T09:30:00Z" timeZone="UTC" />
      <DaySeparator id="level" date="2026-10-02" timeZone="UTC" level={2} />
      <DaySeparator id="absolute" date="2026-11-18T09:30:00Z" timeZone="UTC" relative={false} />
      <DaySeparator id="late-utc" date="2026-11-17T23:30:00Z" timeZone="UTC" />
      <DaySeparator id="late-tokyo" date="2026-11-17T23:30:00Z" timeZone="Asia/Tokyo" />
    </div>
  ),
  hydrate: () => <Hydrated />,
};
