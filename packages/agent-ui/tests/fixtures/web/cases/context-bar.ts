import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineContextBar } from "../../../../src/web/context-bar.js";
import { contextChips, contextHost } from "../../shared/context-bar.js";

const { host, record } = contextHost();

const page =
  ({
    count = 6,
    motion,
    refusing = false,
    written = false,
  }: {
    count?: number;
    motion?: MotionMode;
    refusing?: boolean;
    written?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineContextBar();
    const wrapper = document.createElement("div");
    wrapper.className = "p-6";
    wrapper.style.width = "360px";
    wrapper.style.boxSizing = "content-box";
    const bar = document.createElement("kind-context-bar");
    bar.id = "context";
    bar.style.setProperty("--kind-context-chip-max-width", "120px");
    if (written)
      bar.innerHTML = `
        <kind-context-bar-list>
        </kind-context-bar-list>
        <kind-context-bar-overflow><button></button></kind-context-bar-overflow>
        <kind-context-bar-content hidden>
          <kind-context-bar-overflow-list>
          </kind-context-bar-overflow-list>
        </kind-context-bar-content>`;
    bar.chips = contextChips(count);
    bar.canRemove = true;
    if (motion) bar.motion = motion;
    bar.addEventListener("contextremove", (event) => {
      record(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
      else bar.chips = (bar.chips ?? []).filter((chip) => chip.id !== event.detail.value);
    });
    const below = Object.assign(document.createElement("textarea"), { id: "below" });
    below.setAttribute("aria-label", "Message");
    wrapper.append(bar, below);
    root.append(wrapper);
    let added = count;
    Object.assign(window, {
      kindHost: host,
      kindContext: {
        add: () => {
          added++;
          bar.chips = [
            ...(bar.chips ?? []),
            { id: `added-${added}`, label: `notes/added-${added}.md and more`, kind: "file" },
          ];
        },
      },
    });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  none: page({ motion: "none" }),
  refusing: page({ refusing: true }),
  written: page({ written: true }),
  "many-10": page({ count: 10 }),
  "many-200": page({ count: 200 }),
};
