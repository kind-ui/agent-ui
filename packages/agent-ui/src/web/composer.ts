import "@ui-sdk/web/file-input";
import "@ui-sdk/web/token-input";
import {
  type ComposerApi,
  type ComposerDraft,
  type ComposerOptions,
  type ComposerState,
  type ComposerValueChangeReason,
  composerPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import type { Token } from "@ui-sdk/web/token-input";
import { defineAttachments } from "./attachments.js";
import { defineInternalTriggerMenu } from "./internal/trigger-menu.js";

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
 *     </ui-file-input-dropzone></ui-file-input>
 *   </form>
 * </kind-composer>
 * ```
 *
 * Set `mentions`, `commands` and `history` as properties. `onSubmit` is a `composersubmit` event whose listeners
 * call `event.detail.waitUntil(promise)`. The `can-stop` attribute shows Stop while pending; it fires `stop`.
 * With `draft-key` and the `draftStorage` property, an empty `kind-composer-restored` fills in "Draft restored" and
 * its `kind-composer-discard`.
 */
export function defineComposer(): void {
  if (customElements.get("kind-composer")) return;
  defineAttachments();
  defineInternalTriggerMenu();
  createParts(composerPrimitive, {
    root: {
      tag: "kind-composer",
      target: wrappedChild("form"),
      display: "contents",
      kinds: { canStop: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindComposerElement).canStop ? {} : { onStop: undefined }),
      events: { onSubmit: "composersubmit" },
      defaults: { agentConfirm: true },
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(value ?? ""),
        },
      },
      api: ["getValue", "setValue", "insertToken", "removeAttachment", "submit"],
      render: (el, instance) => {
        const api = instance.api as ComposerApi;
        const draw = () => {
          const restored = el.querySelector("kind-composer-restored");
          if (restored && !restored.firstElementChild) {
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
    stop: { tag: "kind-composer-stop", target: wrappedButton, display: "contents" },
    restored: "kind-composer-restored",
    discard: { tag: "kind-composer-discard", target: wrappedButton, display: "contents" },
  });
}

export type KindComposerEvents = {
  valuechange: UiChangeEvent<ComposerDraft, ComposerValueChangeReason>;
  composersubmit: CustomEvent<{ value: ComposerDraft } & Pick<UiActionDetail, "waitUntil">>;
  stop: CustomEvent<{ value: undefined }>;
};

export interface KindComposerElement
  extends UiElement<KindComposerEvents>,
    AttributeProperties<
      typeof composerPrimitive,
      "api" | "commands" | "defaultValue" | "draftStorage" | "history" | "mentions" | "value"
    > {
  canStop: boolean;
  get value(): ComposerDraft;
  set value(value: ComposerDraft | string);
  defaultValue?: ComposerOptions["defaultValue"];
  mentions?: ComposerOptions["mentions"];
  commands?: ComposerOptions["commands"];
  history?: ComposerOptions["history"];
  draftStorage?: ComposerOptions["draftStorage"];
  api: Pick<ComposerApi, "getValue" | "setValue" | "insertToken" | "removeAttachment" | "submit">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-composer": KindComposerElement;
    "kind-composer-input": HTMLElement;
    "kind-composer-trigger-menu": HTMLElement;
    "kind-composer-attachments": HTMLElement;
    "kind-composer-submit": HTMLElement;
    "kind-composer-stop": HTMLElement;
    "kind-composer-restored": HTMLElement;
    "kind-composer-discard": HTMLElement;
  }
}
