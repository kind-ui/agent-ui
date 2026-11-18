import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineDictation } from "../../../../src/web/dictation.js";
import { dictationHost } from "../../shared/dictation.js";

const { host, source, record } = dictationHost();

const page =
  ({ motion, withSource = true }: { motion?: MotionMode; withSource?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineDictation();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    wrapper.style.width = "320px";
    const dictation = document.createElement("kind-dictation");
    if (withSource) dictation.source = source;
    if (motion) dictation.motion = motion;
    dictation.addEventListener("dictationtext", (event) => record(event.detail.value, event.detail));
    wrapper.append(dictation);
    root.append(wrapper);
    Object.assign(window, { kindDictation: host });
  };

export const cases = {
  default: page(),
  reduced: page({ motion: "reduced" }),
  none: page({ motion: "none" }),
  "no-source": page({ withSource: false }),
};
