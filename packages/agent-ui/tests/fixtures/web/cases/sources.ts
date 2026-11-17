import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineSources } from "../../../../src/web/sources.js";
import { nextSources, sources } from "../../shared/sources.js";

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineSources();
    const container = document.createElement("div");
    container.className = "w-[30rem] p-6";
    const element = document.createElement("kind-sources");
    element.id = "sources";
    if (motion) element.motion = motion;
    container.append(element);
    root.append(container);
    element.sources = sources;
    Object.assign(window, {
      kindHost: {
        add: () => {
          element.sources = nextSources.add(element.sources ?? []);
        },
        rename: () => {
          element.sources = nextSources.rename(element.sources ?? []);
        },
      },
    });
  };

export const cases = { all: page(), reduced: page({ motion: "reduced" }) };
