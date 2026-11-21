import { daySeparatorPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(daySeparatorPrimitive, { root: "div", label: "time" });

export type DaySeparatorProps = ComponentProps<typeof parts.Root>;

/** A heading between days: the date on the server, and "Today", "Yesterday" or a weekday once in the browser. */
export function DaySeparator(props: DaySeparatorProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DaySeparatorLabel />}</parts.Root>;
}

export type DaySeparatorLabelProps = ComponentProps<typeof parts.Label>;

/** The day as a `<time datetime>`: its words, unless you pass children. */
export function DaySeparatorLabel(props: DaySeparatorLabelProps) {
  return (
    <parts.Label {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Label>
  );
}
