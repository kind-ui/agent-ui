import {
  type DictationApi,
  type DictationSource,
  type DictationTextReason,
  dictationButtonPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS =
  "<kind-dictation-waveform></kind-dictation-waveform>" +
  "<kind-dictation-status><kind-dictation-status-icon></kind-dictation-status-icon><span data-dictation-text></span></kind-dictation-status>" +
  "<kind-dictation-start><button></button></kind-dictation-start>" +
  "<kind-dictation-cancel><button></button></kind-dictation-cancel>" +
  "<kind-dictation-stop><button></button></kind-dictation-stop>";

/** Gives the waveform one `kind-dictation-bar` per level, adding or removing bars at its end. */
const drawBars = (waveform: Element | null, count: number) => {
  if (!waveform) return;
  const bars = waveform.querySelectorAll(":scope > kind-dictation-bar");
  for (let i = bars.length; i < count; i++) {
    const bar = waveform.ownerDocument.createElement("kind-dictation-bar");
    bar.setAttribute("value", String(i));
    waveform.append(bar);
  }
  for (let i = count; i < bars.length; i++) bars[i]?.remove();
};

/**
 * `<kind-dictation>` fills in its waveform, status, mic button, Cancel and Stop when it has no children, and an empty
 * `<kind-dictation-status>` with its mark and a `[data-dictation-text]` span, where the status text goes. Set `source`
 * as a property; the final text arrives as a `dictationtext` event.
 */
export function defineDictation(): void {
  if (customElements.get("kind-dictation")) return;
  createParts(dictationButtonPrimitive, {
    root: {
      tag: "kind-dictation",
      events: { onText: "dictationtext" },
      defaults: { agentConfirm: true },
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as DictationApi;
        const draw = () => {
          const state = instance.get();
          drawBars(el.querySelector("kind-dictation-waveform"), state.levels.length);
          const status = el.querySelector("kind-dictation-status");
          if (status && !status.firstElementChild)
            status.innerHTML =
              "<kind-dictation-status-icon></kind-dictation-status-icon><span data-dictation-text></span>";
          const text = status?.querySelector("[data-dictation-text]");
          const { text: words } = api.statusState(state);
          if (text && text.textContent !== words) text.textContent = words;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    start: { tag: "kind-dictation-start", target: wrappedButton, display: "contents" },
    waveform: "kind-dictation-waveform",
    bar: "kind-dictation-bar",
    status: "kind-dictation-status",
    "status-icon": "kind-dictation-status-icon",
    stop: { tag: "kind-dictation-stop", target: wrappedButton, display: "contents" },
    cancel: { tag: "kind-dictation-cancel", target: wrappedButton, display: "contents" },
  });
}

export type KindDictationEvents = {
  dictationtext: UiChangeEvent<string, DictationTextReason>;
};

export interface KindDictationElement
  extends UiElement<KindDictationEvents>,
    AttributeProperties<typeof dictationButtonPrimitive, "source"> {
  source?: DictationSource;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-dictation": KindDictationElement;
    "kind-dictation-start": HTMLElement;
    "kind-dictation-waveform": HTMLElement;
    "kind-dictation-bar": UiPartElement<typeof dictationButtonPrimitive, "bar", "value">;
    "kind-dictation-status": HTMLElement;
    "kind-dictation-status-icon": HTMLElement;
    "kind-dictation-stop": HTMLElement;
    "kind-dictation-cancel": HTMLElement;
  }
}
