import "@ui-sdk/web/file-input";
import "@ui-sdk/web/token-input";
import {
  type ComposerApi,
  type ComposerDraft,
  type ComposerOptions,
  type ComposerSendMenuState,
  type ComposerState,
  type ComposerSteerDetails,
  type ComposerValueChangeReason,
  composerPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import type { Token } from "@ui-sdk/web/token-input";
import { defineAttachments } from "./attachments.js";
import { defineInternalMenu, menuElement, placeMenuChild } from "./internal/menu.js";
import { defineInternalTriggerMenu } from "./internal/trigger-menu.js";

const SEND_MENU = `<kind-internal-menu><ui-menu><kind-composer-steer><button></button></kind-composer-steer><kind-composer-send-menu-trigger data-menu-part="trigger"><ui-menu-trigger><button type="button" data-agent-hidden><span data-composer-chevron aria-hidden="true"></span></button></ui-menu-trigger></kind-composer-send-menu-trigger><ui-menu-content side="top" align="end" side-offset="8" data-composer-send-menu></ui-menu-content></ui-menu></kind-internal-menu>`;

// Parts this element filled in, and so keeps drawing. Kept across instances, since UI SDK rebuilds one when the
// element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, unknown>();

const write = (el: Element | null, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

// A row's check, words and keys, as React's default rows are, kept by `value` so an open menu keeps its rows.
function drawSendItems(content: Element, items: ComposerSendMenuState["items"]): void {
  if (!content.firstElementChild) owned.add(content);
  if (!owned.has(content) || drawn.get(content) === items) return;
  drawn.set(content, items);
  const doc = content.ownerDocument;
  let before: Element | null = content.firstElementChild;
  const place = (child: Element) => {
    placeMenuChild(content, child, before);
    before = child.nextElementSibling;
  };
  const kept = new Set<Element>();
  for (const item of items) {
    if (item.value === "stop-and-send") {
      const separator =
        content.querySelector(":scope > ui-menu-separator") ?? menuElement(doc, "ui-menu-separator");
      place(separator);
      kept.add(separator);
    }
    let row = content.querySelector(`:scope > ui-menu-item[value="${item.value}"]`);
    if (!row) {
      row = menuElement(doc, "ui-menu-item", { value: item.value });
      row.innerHTML =
        '<span data-composer-check aria-hidden="true"></span><span data-composer-send-text><span data-composer-send-label></span><span data-composer-send-description></span></span><kbd data-composer-send-keys></kbd>';
    }
    if (row.getAttribute("label") !== item.label) row.setAttribute("label", item.label);
    if (row.hasAttribute("data-current") !== item.checked) row.toggleAttribute("data-current", item.checked);
    write(row.querySelector("[data-composer-send-label]"), item.label);
    write(row.querySelector("[data-composer-send-description]"), item.description);
    const keys = row.querySelector("[data-composer-send-keys]") as HTMLElement;
    write(keys, item.shortcut);
    keys.hidden = !item.shortcut;
    place(row);
    kept.add(row);
  }
  for (const child of [...content.children]) if (!kept.has(child)) child.remove();
}

// Writes only what changed: setting a UI SDK element's property makes it render again.
function assign(el: Element | null, properties: Record<string, unknown>): void {
  if (!el) return;
  const target = el as unknown as Record<string, unknown>;
  for (const [name, value] of Object.entries(properties)) {
    if (target[name] !== value) target[name] = value;
  }
}

function renderToken(token: Token, host: HTMLElement): void {
  host.innerHTML =
    "<ui-token-input-token><span></span><ui-token-input-token-remove></ui-token-input-token-remove></ui-token-input-token>";
  (host.querySelector("span") as HTMLSpanElement).textContent = token.label;
}

/**
 * `<kind-composer>` wraps a `<form aria-label="…">` whose content is a File Input drop zone:
 *
 * ```html
 * <kind-composer>
 *   <form aria-label="Message">
 *     <ui-file-input><ui-file-input-dropzone>
 *       <kind-composer-attachments><kind-attachments aria-label="Attachments"></kind-attachments></kind-composer-attachments>
 *       <kind-composer-input><ui-token-input>
 *         <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
 *         <kind-composer-trigger-menu><kind-internal-trigger-menu><ui-trigger-menu><ui-trigger-menu-content>
 *           <ui-trigger-menu-empty>No matches</ui-trigger-menu-empty><ui-trigger-menu-list></ui-trigger-menu-list>
 *         </ui-trigger-menu-content></ui-trigger-menu></kind-internal-trigger-menu></kind-composer-trigger-menu>
 *       </ui-token-input></kind-composer-input>
 *       <ui-file-input-trigger><button type="button" aria-label="Attach files"></button></ui-file-input-trigger>
 *       <kind-composer-restored></kind-composer-restored>
 *       <kind-composer-submit><button></button></kind-composer-submit>
 *       <kind-composer-stop><button></button></kind-composer-stop>
 *       <kind-composer-send-menu></kind-composer-send-menu>
 *     </ui-file-input-dropzone></ui-file-input>
 *   </form>
 * </kind-composer>
 * ```
 *
 * Set `mentions`, `commands` and `history` as properties. `onSubmit` is a `composersubmit` event whose listeners
 * call `event.detail.waitUntil(promise)`. The `can-stop` attribute shows Stop while pending or `running`; it fires
 * `stop`. With `running` and `can-steer`, an empty `kind-composer-send-menu` fills in Steer and its menu, which fire
 * `composersteer` with the draft as `detail.value` and `detail.mode`.
 * With `draft-key` and the `draftStorage` property, an empty `kind-composer-restored` fills in "Draft restored" and
 * its `kind-composer-discard`.
 */
export function defineComposer(): void {
  if (customElements.get("kind-composer")) return;
  defineAttachments();
  defineInternalMenu();
  defineInternalTriggerMenu();
  createParts(composerPrimitive, {
    root: {
      tag: "kind-composer",
      target: wrappedChild("form"),
      display: "contents",
      kinds: { canStop: "boolean", canSteer: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ({
        ...((el as KindComposerElement).canStop ? {} : { onStop: undefined }),
        ...((el as KindComposerElement).canSteer ? {} : { onSteer: undefined }),
      }),
      events: { onSubmit: "composersubmit", onSteer: "composersteer" },
      defaults: { agentConfirm: true },
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(value ?? ""),
        },
      },
      api: ["getValue", "setValue", "appendText", "insertToken", "removeAttachment", "submit"],
      render: (el, instance) => {
        const api = instance.api as ComposerApi;
        const draw = () => {
          const sendMenu = el.querySelector("kind-composer-send-menu");
          if (sendMenu && !sendMenu.firstElementChild) sendMenu.innerHTML = SEND_MENU;
          const restored = el.querySelector("kind-composer-restored");
          if (restored && !restored.firstElementChild && !restored.textContent?.trim()) {
            restored.innerHTML =
              "<span>Draft restored</span><kind-composer-discard><button>Discard</button></kind-composer-discard>";
          }
          const state = instance.get() as ComposerState;
          const { fileInput } = api.partState.root(state);
          const { tokenInput } = api.partState.input(state);
          assign(el.querySelector("ui-file-input"), {
            multiple: fileInput.multiple,
            disabled: fileInput.disabled,
            accept: fileInput.accept,
            maxSize: fileInput.maxSize,
          });
          assign(el.querySelector("ui-token-input"), {
            controller: tokenInput.controller,
            submitShortcut: tokenInput.submitShortcut,
            disabled: tokenInput.disabled,
            renderToken,
          });
          api.connectInput();
          assign(
            el.querySelector("kind-composer-trigger-menu ui-trigger-menu"),
            api.partState.triggerMenu(state),
          );
          const { controller, open, items } = api.partState.sendMenu(state);
          assign(el.querySelector("kind-composer-send-menu ui-menu"), { controller, open });
          const steer = el.querySelector("kind-composer-steer > button");
          if (steer && !steer.firstChild) owned.add(steer);
          if (steer && owned.has(steer)) write(steer, api.partState.steer(state).label);
          const trigger = el.querySelector("kind-composer-send-menu-trigger > ui-menu-trigger");
          const triggerProps = api.partState.sendMenuTrigger(state);
          trigger?.toggleAttribute("disabled", triggerProps.disabled);
          const chevron = trigger?.querySelector("button");
          if (chevron && chevron.ariaLabel !== triggerProps["aria-label"])
            chevron.ariaLabel = triggerProps["aria-label"];
          const content = el.querySelector("kind-composer-send-menu ui-menu-content");
          if (content) drawSendItems(content, items);
          const { onRemove, ...attachments } = api.partState.attachments(state);
          assign(el.querySelector("kind-composer-attachments kind-attachments"), {
            ...attachments,
            removeHandler: onRemove,
          });
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Content added after the composer connects, like a framework's conditional markup, needs its props too.
        const arrivals = new MutationObserver((records) => {
          if (records.some((record) => [...record.addedNodes].some((node) => node instanceof Element)))
            draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    input: "kind-composer-input",
    "trigger-menu": "kind-composer-trigger-menu",
    attachments: "kind-composer-attachments",
    submit: { tag: "kind-composer-submit", target: wrappedButton, display: "contents" },
    steer: { tag: "kind-composer-steer", target: wrappedButton, display: "contents" },
    "send-menu": "kind-composer-send-menu",
    "send-menu-trigger": { tag: "kind-composer-send-menu-trigger", display: "contents" },
    stop: { tag: "kind-composer-stop", target: wrappedButton, display: "contents" },
    restored: "kind-composer-restored",
    discard: { tag: "kind-composer-discard", target: wrappedButton, display: "contents" },
  });
}

export type KindComposerEvents = {
  valuechange: UiChangeEvent<ComposerDraft, ComposerValueChangeReason>;
  composersubmit: CustomEvent<{ value: ComposerDraft } & Pick<UiActionDetail, "waitUntil">>;
  stop: CustomEvent<{ value: undefined }>;
  composersteer: CustomEvent<
    { value: ComposerDraft } & ComposerSteerDetails & Pick<UiActionDetail, "waitUntil">
  >;
};

export interface KindComposerElement
  extends UiElement<KindComposerEvents>,
    AttributeProperties<
      typeof composerPrimitive,
      "api" | "commands" | "defaultValue" | "draftStorage" | "history" | "mentions" | "value"
    > {
  canStop: boolean;
  /** Whether Send shows beside Stop while `running`, firing `composersteer` with `detail.mode`. */
  canSteer: boolean;
  get value(): ComposerDraft;
  set value(value: ComposerDraft | string);
  defaultValue?: ComposerOptions["defaultValue"];
  mentions?: ComposerOptions["mentions"];
  commands?: ComposerOptions["commands"];
  history?: ComposerOptions["history"];
  draftStorage?: ComposerOptions["draftStorage"];
  api: Pick<
    ComposerApi,
    "getValue" | "setValue" | "appendText" | "insertToken" | "removeAttachment" | "submit"
  >;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-composer": KindComposerElement;
    "kind-composer-input": HTMLElement;
    "kind-composer-trigger-menu": HTMLElement;
    "kind-composer-attachments": HTMLElement;
    "kind-composer-submit": HTMLElement;
    "kind-composer-steer": HTMLElement;
    "kind-composer-send-menu": HTMLElement;
    "kind-composer-send-menu-trigger": HTMLElement;
    "kind-composer-stop": HTMLElement;
    "kind-composer-restored": HTMLElement;
    "kind-composer-discard": HTMLElement;
  }
}
