import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineGeneratedImage } from "../../../../src/web/generated-image.js";
import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

const create = (id: string, alt: string, props: Record<string, unknown>, motion?: MotionMode) => {
  const element = document.createElement("kind-generated-image");
  element.id = id;
  element.alt = alt;
  Object.assign(element, size, props);
  if (motion) element.motion = motion;
  return element;
};

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineGeneratedImage();
    const downloads: string[] = [];
    const container = document.createElement("div");
    container.className = "flex w-[30rem] flex-col gap-4 p-6";
    const lifecycle = create(
      "lifecycle",
      "A lighthouse at night",
      { status: "generating", progress: 40, preview },
      motion,
    );
    const loaded = create("loaded", "A lighthouse at dusk", { src: lighthouse }, motion);
    loaded.canDownload = true;
    loaded.addEventListener("download", (event) => downloads.push(event.detail.source));
    container.append(
      lifecycle,
      loaded,
      create(
        "failed",
        "A lighthouse in a storm",
        { status: "error", error: "Generation timed out." },
        motion,
      ),
    );
    root.append(container);
    Object.assign(window, {
      kindHost: {
        downloads,
        progress: (value: number | undefined) => {
          lifecycle.progress = value;
        },
        ready: (url?: string) => {
          lifecycle.src = url ?? lighthouse;
          lifecycle.status = "ready";
        },
        fail: () => {
          lifecycle.status = "error";
        },
        missing,
      },
    });
  };

export const cases = { all: page(), reduced: page({ motion: "reduced" }) };
