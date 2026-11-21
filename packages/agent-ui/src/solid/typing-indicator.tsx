import { typingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";

const parts = createParts(typingIndicatorPrimitive, {
  root: "span",
  label: "span",
  dots: "span",
  dot: "span",
});

export type TypingIndicatorProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/** A polite status: three flowing dots where the reply will start. Its `label`, "Typing" by default, is for assistive technology. */
export function TypingIndicator(props: TypingIndicatorProps) {
  return (
    <parts.Root {...props}>
      <parts.Label>{(state) => state.label}</parts.Label>
      <parts.Dots>
        <parts.Dot />
        <parts.Dot />
        <parts.Dot />
      </parts.Dots>
    </parts.Root>
  );
}
