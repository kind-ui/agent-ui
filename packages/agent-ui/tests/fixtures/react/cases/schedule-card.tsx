import { useEffect, useRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { ScheduleCard } from "../../../../src/react/schedule-card.js";
import { scheduleCardHost, schedules } from "../../shared/schedule-card.js";

const { host, record, runNow } = scheduleCardHost();

function Page({
  name = "all",
  refusing = false,
  agentConfirm,
  actions = true,
}: {
  name?: string;
  refusing?: boolean;
  agentConfirm?: boolean;
  actions?: boolean;
}) {
  const [schedule, setSchedule] = useState(schedules[name] ?? schedules.all);
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="max-w-[28rem] p-6">
      <ScheduleCard
        id="schedule"
        schedule={schedule}
        timeZone="UTC"
        agentConfirm={agentConfirm}
        onEnabledChange={(enabled, details) => {
          record("enabled", details, enabled);
          if (!refusing) setSchedule((current) => current && { ...current, enabled });
        }}
        {...(actions && {
          onRunNow: runNow,
          onEdit: (id: string, details: { reason: string; source?: string }) => record("edit", details, id),
        })}
      />
    </div>
  );
}

function Hydrated() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const card = <ScheduleCard schedule={schedules.all} timeZone="UTC" />;
    const errors: string[] = [];
    el.innerHTML = renderToString(card);
    Object.assign(window, { kindServerMarkup: el.innerHTML, kindHydrationErrors: errors });
    const root = hydrateRoot(el, card, { onRecoverableError: (error) => errors.push(String(error)) });
    return () => queueMicrotask(() => root.unmount());
  }, []);
  return <div id="hydrated" ref={container} className="max-w-[28rem] p-6" />;
}

export const cases = {
  all: () => <Page />,
  soon: () => <Page name="soon" />,
  paused: () => <Page name="paused" />,
  unsafe: () => <Page name="unsafe" />,
  new: () => <Page name="new" />,
  refusing: () => <Page refusing />,
  unconfirmed: () => <Page agentConfirm={false} />,
  bare: () => <Page actions={false} />,
  hydrate: () => <Hydrated />,
};
