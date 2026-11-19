import { defineDaySeparator, type KindDaySeparatorElement } from "../../../../src/web/day-separator.js";

export const cases = {
  all: (root: HTMLElement) => {
    defineDaySeparator();
    root.innerHTML = `
      <div class="flex flex-col gap-3 p-6">
        <kind-day-separator id="today" date="2026-11-18T09:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="yesterday" date="2026-11-17T09:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="weekday" date="2026-11-13T09:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="older" date="2026-10-02T09:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="level" date="2026-10-02" time-zone="UTC" level="2"></kind-day-separator>
        <kind-day-separator id="absolute" date="2026-11-18T09:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="late-utc" date="2026-11-17T23:30:00Z" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="late-tokyo" date="2026-11-17T23:30:00Z" time-zone="Asia/Tokyo"></kind-day-separator>
        <kind-day-separator id="undated" time-zone="UTC"></kind-day-separator>
        <kind-day-separator id="written" date="2026-11-18T09:30:00Z" time-zone="UTC"><span>Pending</span></kind-day-separator>
      </div>`;
    const absolute = root.querySelector<KindDaySeparatorElement>("#absolute");
    if (absolute) absolute.relative = false;
  },
};
