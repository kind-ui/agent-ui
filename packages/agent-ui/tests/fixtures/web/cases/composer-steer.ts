import type { AgentAction } from "@ui-sdk/web/agent";
import { defineComposer, type KindComposerElement } from "../../../../src/web/composer.js";
import { defineQueue, type KindQueueElement } from "../../../../src/web/queue.js";
import { recorder } from "../../shared/composer.js";
import { sendRecorder, steerQueue, steerRecorder } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";

const markup = (attributes: string) => `
  <div class="mx-auto max-w-xl p-6">
    <kind-composer ${attributes}>
      <form aria-label="Message">
        <ui-file-input>
          <ui-file-input-dropzone>
            <kind-composer-input>
              <ui-token-input>
                <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
              </ui-token-input>
            </kind-composer-input>
            <ui-file-input-trigger><button type="button" aria-label="Attach files"></button></ui-file-input-trigger>
            <kind-composer-submit><button></button></kind-composer-submit>
            <kind-composer-steer-menu></kind-composer-steer-menu>
            <kind-composer-stop><button></button></kind-composer-stop>
          </ui-file-input-dropzone>
        </ui-file-input>
      </form>
    </kind-composer>
  </div>`;

function steer(root: HTMLElement, params: URLSearchParams, submitOn: "enter" | "mod-enter") {
  defineComposer();
  const attributes = [
    `submit-on="${submitOn}"`,
    "can-stop",
    params.has("no-steer") ? "" : "can-steer",
    params.has("idle") ? "" : "running",
    params.has("mode") ? `steer-mode="${params.get("mode")}"` : "",
  ];
  root.innerHTML = markup(attributes.join(" "));
  const composer = root.querySelector("kind-composer") as KindComposerElement;
  const { onSubmit } = recorder();
  const { onSteer, onStop } = steerRecorder();
  composer.addEventListener("stop", onStop);
  composer.addEventListener("composersubmit", ({ detail }) => detail.waitUntil(onSubmit(detail.value)));
  composer.addEventListener("steer", ({ detail }) =>
    detail.waitUntil(onSteer(detail.value, { mode: detail.mode, source: detail.source })),
  );
  expose({ setRunning: (next: boolean) => composer.toggleAttribute("running", next) });
}

// An agent needs a person for every composer action, unless the test permits it.
export const allow = (step: AgentAction) =>
  !step.confirm || (window as { permit?: boolean }).permit === true;

export const cases = {
  steer: (root: HTMLElement, params: URLSearchParams) => steer(root, params, "enter"),
  "steer-mod-enter": (root: HTMLElement, params: URLSearchParams) => steer(root, params, "mod-enter"),
  queue: (root: HTMLElement) => {
    defineQueue();
    root.innerHTML = `<div class="flex w-[24rem] flex-col gap-4 p-6"><kind-queue label="Queue" can-send></kind-queue></div>`;
    const queue = root.querySelector("kind-queue") as KindQueueElement;
    queue.items = steerQueue;
    const onSend = sendRecorder();
    queue.addEventListener("queuesend", ({ detail }) => detail.waitUntil(onSend(detail.value, detail)));
    expose({
      kindQueue: { remove: (id: string) => (queue.items = (queue.items ?? []).filter((item) => item.id !== id)) },
    });
  },
};
