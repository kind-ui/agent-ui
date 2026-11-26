import type { CheckpointOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineCheckpoint } from "../../../../src/web/checkpoint.js";
import { checkpointHost, SCOPED } from "../../shared/checkpoint.js";

const { host, restore, compare } = checkpointHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const checkpoints = (motion?: CheckpointOptions["motion"], scoped?: boolean) => (root: HTMLElement) => {
  defineCheckpoint();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
  const below = Object.assign(document.createElement("p"), { id: "below", textContent: "Below" });
  const checkpoint = document.createElement("kind-checkpoint");
  checkpoint.id = "checkpoint";
  checkpoint.description = "Before editing auth.ts";
  checkpoint.canRestore = true;
  if (motion) checkpoint.motion = motion;
  if (scoped) {
    Object.assign(checkpoint, SCOPED);
    checkpoint.canCompare = true;
    checkpoint.addEventListener("compare", (event) => compare(event.detail.value));
  }
  checkpoint.addEventListener("restore", (event) => event.detail.waitUntil(restore(event.detail.value)));
  page.append(above, checkpoint, below);
  root.append(page);
  Object.assign(window, {
    kindHost: host,
    kindCheckpoint: {
      restore: (restored: boolean) => {
        checkpoint.restored = restored;
      },
    },
  });
};

export const cases = {
  all: checkpoints(),
  reduced: checkpoints("reduced"),
  scoped: checkpoints(undefined, true),
};
