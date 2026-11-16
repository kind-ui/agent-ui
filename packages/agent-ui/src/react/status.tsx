import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

const parts = createParts(statusPrimitive, { root: "span", icon: "span", label: "span" });

export type StatusProps = ComponentProps<typeof parts.Root>;

/** A run status badge: its mark and label, unless you pass `StatusIcon` and `StatusLabel` yourself. */
export function Status({ children, ...props }: StatusProps) {
  return (
    <parts.Root {...props}>
      {children ?? (
        <>
          <parts.Icon />
          <StatusLabel />
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
