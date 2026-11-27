import { statusPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(statusPrimitive, { root: "span", icon: "span", label: "span", stalled: "span" });

export type StatusProps = ComponentProps<typeof parts.Root>;

/**
 * A run status badge: its mark, label and, while stalled, "No update for 5 min". Any `children`, `StatusIcon`,
 * `StatusLabel` and `StatusStalled` among them, replace these.
 */
export function Status(props: StatusProps) {
  const rest = omit(props, "children");
  return (
    <parts.Root {...rest}>
      {(() => {
        const children = props.children;
        return children !== undefined ? (
          children
        ) : (
          <>
            <parts.Icon />
            <StatusLabel />
            <StatusStalled />
          </>
        );
      })()}
    </parts.Root>
  );
}

export const StatusIcon = parts.Icon;

export type StatusLabelProps = ComponentProps<typeof parts.Label>;

/** The status's text: its `label`, unless you pass children. */
export function StatusLabel(props: StatusLabelProps) {
  return <parts.Label {...props}>{props.children ?? ((state) => state.label)}</parts.Label>;
}

export type StatusStalledProps = Omit<ComponentProps<typeof parts.Stalled>, "children">;

/** "No update for 5 min", while a running status has had no update for `stalledAfter`. */
export function StatusStalled(props: StatusStalledProps) {
  return <parts.Stalled {...props}>{(state) => state.text}</parts.Stalled>;
}
