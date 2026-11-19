import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineComposer } from "../../../../src/web/composer.js";
import { defineConversation } from "../../../../src/web/conversation.js";
import { defineLauncher } from "../../../../src/web/launcher.js";
import { launcherHost, messages } from "../../shared/launcher.js";

const { record, click } = launcherHost();

const page =
  ({
    unread,
    modal,
    motion,
    shortcut,
    title = "",
  }: {
    unread?: number;
    modal?: boolean;
    motion?: MotionMode;
    shortcut?: string;
    title?: string;
  } = {}) =>
  (root: HTMLElement) => {
    defineConversation();
    defineComposer();
    defineLauncher();
    root.innerHTML = `
      <div class="p-6">
        <button id="page-button" type="button">Page button</button>
        <kind-launcher id="launcher"${modal ? " modal" : ""}>
          <kind-launcher-content>${title}
            <kind-conversation aria-label="Chat" message-count="${messages.length}" class="h-48">
              <kind-conversation-viewport>
                <kind-conversation-content>
                  ${messages
                    .map(
                      (message, index) =>
                        `<kind-conversation-row value="${message.id}" index="${index}"><p data-message="${message.id}">${message.text}</p></kind-conversation-row>`,
                    )
                    .join("")}
                </kind-conversation-content>
              </kind-conversation-viewport>
            </kind-conversation>
            <kind-composer>
              <form aria-label="Message">
                <ui-file-input>
                  <ui-file-input-dropzone>
                    <kind-composer-input>
                      <ui-token-input>
                        <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
                      </ui-token-input>
                    </kind-composer-input>
                    <kind-composer-submit><button></button></kind-composer-submit>
                  </ui-file-input-dropzone>
                </ui-file-input>
              </form>
            </kind-composer>
          </kind-launcher-content>
        </kind-launcher>
      </div>`;
    root.querySelector("#page-button")?.addEventListener("click", click);
    const launcher = root.querySelector("kind-launcher");
    if (!launcher) return;
    if (unread !== undefined) launcher.unread = unread;
    if (motion) launcher.motion = motion;
    if (shortcut) launcher.shortcut = shortcut;
    launcher.addEventListener("openchange", (event) => record(event.detail.value, event.detail));
  };

export const cases = {
  all: page({ unread: 2, shortcut: "mod+j" }),
  modal: page({ unread: 2, modal: true }),
  read: page(),
  reduced: page({ unread: 2, motion: "reduced" }),
  written: page({ title: "<kind-launcher-title></kind-launcher-title>" }),
};
