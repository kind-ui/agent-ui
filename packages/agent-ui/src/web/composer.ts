import { composerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";

export function defineComposer(): void {
  if (customElements.get("kind-composer")) return;
  createParts(composerPrimitive, {
    root: {
      tag: "kind-composer",
      target: wrappedChild("form"),
      display: "contents",
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(value ?? ""),
        },
      },
      api: ["getValue", "setValue", "submit"],
    },
    input: { tag: "kind-composer-input", target: wrappedChild("textarea"), display: "contents" },
    submit: { tag: "kind-composer-submit", target: wrappedButton, display: "contents" },
  });
}
