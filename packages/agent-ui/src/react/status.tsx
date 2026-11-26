"use client";

import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

const parts = createParts(statusPrimitive, { root: "span", icon: "span", label: "span", stalled: "span" });

export type StatusProps = ComponentProps<typeof parts.Root>;

/**
 * A run status badge: its mark, label and, while stalled, "No update for 5 min". Any `children`, `StatusIcon`,
 * `StatusLabel` and `StatusStalled` among them, replace these.
 */
export function Status({ children, ...props }: StatusProps) {
  return (
    <parts.Root {...props}>
      {children !== undefined ? (
        children
      ) : (
        <>
          <parts.Icon />
          <StatusLabel />
          <StatusStalled />
        </>
      )}
    </parts.Root>
  );
}

export const StatusIcon = parts.Icon;

export type StatusLabelProps = ComponentProps<typeof parts.Label>;

/** The status's text: its `label`, unless you pass children. */
export function StatusLabel({ children = ({ label }) => label, ...props }: StatusLabelProps) {
  return <parts.Label {...props}>{children}</parts.Label>;
}

export type StatusStalledProps = Omit<ComponentProps<typeof parts.Stalled>, "children">;

/** "No update for 5 min", while a running status has had no update for `stalledAfter`. */
export function StatusStalled(props: StatusStalledProps) {
  return <parts.Stalled {...props}>{({ text }) => text}</parts.Stalled>;
}
