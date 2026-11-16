import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineInlineCitation } from "../../../../src/web/inline-citation.js";
import { lateSource, sources } from "../../shared/sources.js";

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineInlineCitation();
    const container = document.createElement("div");
    container.className = "w-[40rem] p-6 text-sm leading-6";
    container.innerHTML = `<p id="prose">Back off when you hit a limit <kind-inline-citation id="many"></kind-inline-citation> and read the header <kind-inline-citation id="one" label="1"></kind-inline-citation>.</p>`;
    root.append(container);
    const many = container.querySelector("#many") as HTMLElementTagNameMap["kind-inline-citation"];
    const one = container.querySelector("#one") as HTMLElementTagNameMap["kind-inline-citation"];
    for (const element of [many, one]) if (motion) element.motion = motion;
    many.sources = sources;
    one.sources = [lateSource];
  };

export const cases = { all: page(), reduced: page({ motion: "reduced" }) };
