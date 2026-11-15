import "@ui-sdk/web/file-input";
import "@ui-sdk/web/token-input";
import { type ComposerApi, type ComposerState, composerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
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

type ComposerElement = HTMLElement & { canStop: boolean };

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
 *       <kind-composer-submit><button></button></kind-composer-submit>
 *       <kind-composer-stop><button></button></kind-composer-stop>
 *     </ui-file-input-dropzone></ui-file-input>
 *   </form>
 * </kind-composer>
 * ```
 *
 * Set `mentions`, `commands` and `history` as properties. `onSubmit` is a `composersubmit` event whose listeners
 * call `event.detail.waitUntil(promise)`. The `can-stop` attribute shows Stop while pending; it fires `stop`.
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
      options: (el) => ((el as ComposerElement).canStop ? {} : { onStop: undefined }),
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
  });
}
