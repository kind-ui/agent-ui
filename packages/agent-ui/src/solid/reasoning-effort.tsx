import { type ReasoningEffortControlState, reasoningEffortPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";
import {
  KindSegmentedControl,
  KindSegmentedControlIndicator,
  KindSegmentedControlItem,
} from "./internal/segmented-control.js";

const parts = createParts(reasoningEffortPrimitive, { root: "div" });

export type ReasoningEffortProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

/**
 * How hard the model thinks, as a row of levels with a mark that slides to the chosen one. Any `children` replace the
 * mark and the levels, inside the Segmented Control.
 */
export function ReasoningEffort(props: ReasoningEffortProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(control: ReasoningEffortControlState) => (
        // Hidden from agents, which use the Reasoning Effort's own `setValue`.
        <KindSegmentedControl
          controller={control.controller}
          defaultValue={control.defaultValue}
          disabled={control.disabled}
          aria-label={control["aria-label"]}
          data-agent-hidden=""
        >
          {props.children ?? (
            <>
              <ReasoningEffortIndicator />
              <For each={control.levels} keyed={(level) => level.value}>
                {(level) => <ReasoningEffortItem value={level().value}>{level().label}</ReasoningEffortItem>}
              </For>
            </>
          )}
        </KindSegmentedControl>
      )}
    </parts.Root>
  );
}

/** The mark behind the chosen level. */
export const ReasoningEffortIndicator = KindSegmentedControlIndicator;

/** A level, whose `value` is what the host receives. */
export const ReasoningEffortItem = KindSegmentedControlItem;
