import type { QueueItem } from "@kind-ui/agent-ui";
import { defineAddMenu } from "../../../../src/web/add-menu.js";
import { defineComposer, type KindComposerElement } from "../../../../src/web/composer.js";
import { defineModelControl } from "../../../../src/web/model-control.js";
import { defineQueue, type KindQueueElement } from "../../../../src/web/queue.js";
import { addItems } from "../../shared/add-menu.js";
import { queuedMessages, steerHost, steerText } from "../../shared/composer-steer.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";

function steer(root: HTMLElement, params: URLSearchParams) {
  defineComposer();
  defineQueue();
  defineAddMenu();
  defineModelControl();
  root.innerHTML = `
    <div class="mx-auto max-w-xl p-6">
      <kind-composer aria-label="Message" can-stop can-steer>
        <form aria-label="Message">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-queue label="Queued messages" can-send can-edit can-remove${params.has("folded") ? ' default-open-sections="complete"' : ""}></kind-queue>
              <kind-composer-input>
                <ui-token-input>
                  <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
                </ui-token-input>
              </kind-composer-input>
              <div data-controls></div>
              <kind-composer-submit><button></button></kind-composer-submit>
              <kind-composer-stop><button></button></kind-composer-stop>
              <kind-composer-send-menu></kind-composer-send-menu>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </div>`;
  const composer = root.querySelector("kind-composer") as KindComposerElement;
  const queue = root.querySelector("kind-queue") as KindQueueElement;
  if (params.has("pending")) queue.sendDisabledReason = "Available after you answer the pending request";
  queue.items = params.has("queue") ? queuedMessages : [];
  composer.running = !params.has("idle");
  composer.steerMode = params.get("mode") === "queue" ? "queue" : "steer";
  if (params.has("text")) composer.value = steerText;

  const host = steerHost(params, {
    items: () => [...(queue.items ?? [])] as QueueItem[],
    setItems: (items) => {
      queue.items = items;
    },
    setRunning: (running) => {
      composer.running = running;
    },
  });
  composer.addEventListener("composersubmit", () => undefined);
  composer.addEventListener("stop", () => host.onStop());
  composer.addEventListener("composersteer", (event) => {
    const settled = host.onSteer(event.detail.value, event.detail);
    if (settled) event.detail.waitUntil(settled);
  });
  queue.addEventListener("send", (event) => host.onSend(event.detail.value, event.detail));
  queue.addEventListener("edit", (event) => host.onEdit(event.detail.value, event.detail));
  queue.addEventListener("remove", (event) => host.onRemove(event.detail.value, event.detail));
  Object.assign(window, {
    setRunning: (running: boolean) => {
      composer.running = running;
    },
  });

  const add = document.createElement("kind-add-menu");
  add.items = addItems;
  add.canRun = true;
  const control = document.createElement("kind-model-control");
  control.models = models;
  control.levels = levels;
  control.defaultModel = "opus";
  control.defaultEffort = "high";
  const row = root.querySelector("[data-controls]") as HTMLElement;
  Object.assign(row.style, controls);
  row.append(add, control);
}

export const cases = {
  steer,
  text: (root: HTMLElement) => steer(root, new URLSearchParams("text")),
  docked: (root: HTMLElement) => steer(root, new URLSearchParams("queue&text")),
};
