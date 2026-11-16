import { defineInternalAvatar } from "../../../../src/web/internal/avatar.js";
import { defineInternalButton } from "../../../../src/web/internal/button.js";
import { defineInternalCollapsible } from "../../../../src/web/internal/collapsible.js";
import { defineInternalFileInput } from "../../../../src/web/internal/file-input.js";
import { defineInternalMenu } from "../../../../src/web/internal/menu.js";
import { defineInternalProgress } from "../../../../src/web/internal/progress.js";
import { defineInternalScrollArea } from "../../../../src/web/internal/scroll-area.js";
import { defineInternalToggle } from "../../../../src/web/internal/toggle.js";
import { defineInternalTokenInput } from "../../../../src/web/internal/token-input.js";
import { defineInternalToolbar } from "../../../../src/web/internal/toolbar.js";
import { defineInternalTriggerMenu } from "../../../../src/web/internal/trigger-menu.js";

const avatarSrc = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')}`;
const lines = Array.from({ length: 40 }, (_, i) => `<p>Line ${i + 1}</p>`).join("");

export const cases = {
  button: (root: HTMLElement) => {
    defineInternalButton();
    root.innerHTML = `
      <kind-internal-button><ui-button><button>Save</button></ui-button></kind-internal-button>
      <output>Pressed 0</output>
    `;
    let presses = 0;
    const output = root.querySelector("output") as HTMLOutputElement;
    root.querySelector("ui-button")?.addEventListener("action", () => {
      output.textContent = `Pressed ${++presses}`;
    });
  },
  collapsible: (root: HTMLElement) => {
    defineInternalCollapsible();
    root.innerHTML = `
      <kind-internal-collapsible>
        <ui-collapsible>
          <ui-collapsible-trigger><button>Details</button></ui-collapsible-trigger>
          <ui-collapsible-panel hidden>Hidden details</ui-collapsible-panel>
        </ui-collapsible>
      </kind-internal-collapsible>
    `;
  },
  "scroll-area": (root: HTMLElement) => {
    defineInternalScrollArea();
    root.innerHTML = `
      <kind-internal-scroll-area>
        <ui-scroll-area class="h-24 w-48">
          <ui-scroll-area-viewport role="region" aria-label="Log">
            <ui-scroll-area-content>${lines}</ui-scroll-area-content>
          </ui-scroll-area-viewport>
          <ui-scroll-area-scrollbar orientation="vertical"><ui-scroll-area-thumb></ui-scroll-area-thumb></ui-scroll-area-scrollbar>
        </ui-scroll-area>
      </kind-internal-scroll-area>
    `;
  },
  toolbar: (root: HTMLElement) => {
    defineInternalToolbar();
    root.innerHTML = `
      <kind-internal-toolbar>
        <ui-toolbar aria-label="Formatting">
          <ui-toolbar-button><button>Undo</button></ui-toolbar-button>
          <ui-toolbar-button><button>Redo</button></ui-toolbar-button>
          <ui-toolbar-separator></ui-toolbar-separator>
          <ui-toolbar-button><button>Copy</button></ui-toolbar-button>
        </ui-toolbar>
      </kind-internal-toolbar>
    `;
  },
  toggle: (root: HTMLElement) => {
    defineInternalToggle();
    root.innerHTML = `<kind-internal-toggle><ui-toggle><button>Bold</button></ui-toggle></kind-internal-toggle>`;
  },
  menu: (root: HTMLElement) => {
    defineInternalMenu();
    root.innerHTML = `
      <kind-internal-menu>
        <ui-menu>
          <ui-menu-trigger><button>Actions</button></ui-menu-trigger>
          <ui-menu-content>
            <ui-menu-item value="rename">Rename</ui-menu-item>
            <ui-menu-item value="duplicate">Duplicate</ui-menu-item>
            <ui-menu-separator></ui-menu-separator>
            <ui-menu-item value="delete">Delete</ui-menu-item>
          </ui-menu-content>
        </ui-menu>
      </kind-internal-menu>
    `;
  },
  avatar: (root: HTMLElement) => {
    defineInternalAvatar();
    root.innerHTML = `
      <kind-internal-avatar>
        <ui-avatar><img src="${avatarSrc}" alt="Ada Lovelace" /><ui-avatar-fallback>AL</ui-avatar-fallback></ui-avatar>
      </kind-internal-avatar>
    `;
  },
  "token-input": (root: HTMLElement) => {
    defineInternalTokenInput();
    root.innerHTML = `
      <kind-internal-token-input>
        <ui-token-input value="Explain [@a.ts](file:src/a.ts)" token-deletion="whole">
          <ui-token-input-editor aria-label="Prompt"></ui-token-input-editor>
          <template>
            <ui-token-input-token>
              <span data-token-label></span>
              <ui-token-input-token-remove>×</ui-token-input-token-remove>
            </ui-token-input-token>
          </template>
        </ui-token-input>
      </kind-internal-token-input>
    `;
  },
  "trigger-menu": (root: HTMLElement) => {
    defineInternalTriggerMenu();
    root.innerHTML = `
      <kind-internal-trigger-menu>
        <ui-trigger-menu>
          <ui-trigger-menu-input><textarea aria-label="Message"></textarea></ui-trigger-menu-input>
          <ui-trigger-menu-content>
            <ui-trigger-menu-list>
              <ui-trigger-menu-item value="hollis" label="Hollis Grant">Hollis Grant</ui-trigger-menu-item>
              <ui-trigger-menu-item value="ines" label="Inès Moreau">Inès Moreau</ui-trigger-menu-item>
            </ui-trigger-menu-list>
          </ui-trigger-menu-content>
        </ui-trigger-menu>
      </kind-internal-trigger-menu>
    `;
    Object.assign(root.querySelector("ui-trigger-menu") as HTMLElement, { triggers: [{ char: "@" }] });
  },
  "file-input": (root: HTMLElement) => {
    defineInternalFileInput();
    root.innerHTML = `
      <kind-internal-file-input>
        <ui-file-input multiple>
          <ui-file-input-dropzone>
            <p>Drop files here</p>
            <ui-file-input-trigger><button>Attach files</button></ui-file-input-trigger>
          </ui-file-input-dropzone>
          <ui-file-input-list aria-label="Files">
            <template>
              <ui-file-input-item>
                <span data-file="name"></span>
                <ui-file-input-item-remove><button type="button">×</button></ui-file-input-item-remove>
              </ui-file-input-item>
            </template>
          </ui-file-input-list>
        </ui-file-input>
      </kind-internal-file-input>
    `;
  },
  progress: (root: HTMLElement) => {
    defineInternalProgress();
    root.innerHTML = `
      <kind-internal-progress>
        <ui-progress value="40">
          <ui-progress-label>Uploading</ui-progress-label>
          <ui-progress-value></ui-progress-value>
          <ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track>
        </ui-progress>
      </kind-internal-progress>
    `;
  },
};
