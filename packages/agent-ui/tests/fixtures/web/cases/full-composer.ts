import { defineAddMenu } from "../../../../src/web/add-menu.js";
import { defineApprovalMode } from "../../../../src/web/approval-mode.js";
import { defineComposer, type KindComposerElement } from "../../../../src/web/composer.js";
import { defineContextBar } from "../../../../src/web/context-bar.js";
import { defineDictation } from "../../../../src/web/dictation.js";
import { defineModelControl } from "../../../../src/web/model-control.js";
import { defineSettingsMenu } from "../../../../src/web/settings-menu.js";
import { addItems } from "../../shared/add-menu.js";
import { initialValue, modes } from "../../shared/approval-mode.js";
import { draftOptions } from "../../shared/composer.js";
import { contextChips } from "../../shared/context-bar.js";
import { dictationHost } from "../../shared/dictation.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";
import { initialValues, settings } from "../../shared/settings-menu.js";

function page(root: HTMLElement) {
  defineComposer();
  defineDictation();
  defineContextBar();
  defineAddMenu();
  defineModelControl();
  defineApprovalMode();
  defineSettingsMenu();
  root.innerHTML = `
    <div class="p-4">
      <kind-composer>
        <form aria-label="Message">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-composer-input>
                <ui-token-input>
                  <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
                </ui-token-input>
              </kind-composer-input>
              <div data-controls></div>
              <kind-composer-restored></kind-composer-restored>
              <kind-composer-submit><button></button></kind-composer-submit>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </div>`;
  const composer = root.querySelector("kind-composer") as KindComposerElement;
  Object.assign(composer, draftOptions(new URLSearchParams(location.search)));

  const bar = document.createElement("kind-context-bar");
  bar.style.setProperty("--kind-context-chip-max-width", "120px");
  bar.chips = contextChips(4);
  bar.canRemove = true;
  bar.addEventListener("contextremove", (event) => {
    bar.chips = (bar.chips ?? []).filter((chip) => chip.id !== event.detail.value);
  });
  root.querySelector("ui-file-input-dropzone")?.prepend(bar);

  const add = document.createElement("kind-add-menu");
  add.items = addItems;
  add.canRun = true;
  const control = document.createElement("kind-model-control");
  control.models = models;
  control.levels = levels;
  control.defaultModel = "opus";
  control.defaultEffort = "high";
  const approval = document.createElement("kind-approval-mode");
  approval.modes = modes;
  approval.value = initialValue;
  approval.addEventListener("modechange", (event) => {
    approval.value = event.detail.value;
  });
  const menu = document.createElement("kind-settings-menu");
  menu.settings = settings;
  menu.values = initialValues;
  menu.addEventListener("valueschange", (event) => {
    menu.values = event.detail.value;
  });
  const row = root.querySelector("[data-controls]") as HTMLElement;
  Object.assign(row.style, controls);
  row.append(add, control, approval, menu);

  const { source } = dictationHost();
  const dictation = document.createElement("kind-dictation");
  dictation.source = source;
  root.querySelector("kind-composer-submit")?.before(dictation);
}

export const cases = {
  all: page,
};
