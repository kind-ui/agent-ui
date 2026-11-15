import { composerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";

const parts = createParts(composerPrimitive, { root: "form", input: "textarea", submit: "button" });

export const Composer = parts.Root;
export const ComposerInput = parts.Input;
export const ComposerSubmit = parts.Submit;
