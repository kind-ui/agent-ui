import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineComposer } from "../../../../src/web/composer.js";
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

const inComposer =
  ({ takeOver = false } = {}) =>
  (root: HTMLElement) => {
    defineComposer();
    defineDictation();
    root.innerHTML = `
      <div class="p-4" style="width: 480px">
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
      </div>`;
    const dictation = document.createElement("kind-dictation");
    dictation.source = source;
    if (takeOver)
      dictation.addEventListener("dictationtext", (event) => {
        event.preventDefault();
        record(event.detail.value, event.detail);
      });
    root.querySelector("kind-composer-submit")?.before(dictation);
    Object.assign(window, { kindDictation: host });
  };

export const cases = {
  default: page(),
  reduced: page({ motion: "reduced" }),
  none: page({ motion: "none" }),
  "no-source": page({ withSource: false }),
  composer: inComposer(),
  "composer-cancel": inComposer({ takeOver: true }),
};
