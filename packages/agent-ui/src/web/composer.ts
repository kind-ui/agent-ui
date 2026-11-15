import { composerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";

let defined = false;

export function defineComposer(): void {
  if (defined) return;
  defined = true;
  createParts(composerPrimitive, {
    root: { tag: "kind-composer", target: wrappedChild("form"), display: "contents" },
    input: { tag: "kind-composer-input", target: wrappedChild("textarea"), display: "contents" },
    submit: { tag: "kind-composer-submit", target: wrappedButton, display: "contents" },
  });
}
