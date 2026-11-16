import { defineStatus } from "../../../../src/web/status.js";

const statuses = ["pending", "running", "awaiting-input", "complete", "error", "cancelled"];

export const cases = {
  all: (root: HTMLElement) => {
    defineStatus();
    root.innerHTML = `
      <div class="flex flex-col items-start gap-3 p-6">
        ${statuses.map((status) => `<kind-status status="${status}"></kind-status>`).join("")}
        <kind-status id="live" status="running"></kind-status>
      </div>`;
    const live = root.querySelector("#live") as HTMLElement;
    const write = (name: string) => (value: string | undefined) =>
      value === undefined ? live.removeAttribute(name) : live.setAttribute(name, value);
    Object.assign(window, {
      kindStatus: { setStatus: write("status"), setLabel: write("label"), setMotion: write("motion") },
    });
  },
};
