import { createSignal, onSettled } from "solid-js";
import { ScheduleCard } from "../../../../src/solid/schedule-card.js";
import { expose } from "../../shared/expose.js";
import { scheduleCardHost, schedules } from "../../shared/schedule-card.js";

const { host, record, runNow } = scheduleCardHost();

function Page(props: { name?: string; refusing?: boolean; agentConfirm?: boolean; actions?: boolean }) {
  const [schedule, setSchedule] = createSignal(schedules[props.name ?? "all"] ?? schedules.all);
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="max-w-[28rem] p-6">
      <ScheduleCard
        id="schedule"
        schedule={schedule()}
        timeZone="UTC"
        agentConfirm={props.agentConfirm}
        onEnabledChange={(enabled, details) => {
          record("enabled", details, enabled);
          if (!props.refusing) setSchedule((current) => current && { ...current, enabled });
        }}
        {...(props.actions !== false && {
          onRunNow: runNow,
          onEdit: (id: string, details: { reason: string; source?: string }) => record("edit", details, id),
        })}
      />
    </div>
  );
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
};
