import { selectionPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";
import { KindToolbar, KindToolbarButton } from "./internal/toolbar.js";

const parts = createParts(selectionPrimitive, {
  root: "div",
  content: "div",
  toolbar: "div",
  item: "span",
});

export type SelectionProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

/**
 * Wraps a reply so selecting text in it shows a toolbar of `actions` above the selection. The `children` are the reply.
 */
export function Selection(props: SelectionProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      <SelectionContent>{props.children}</SelectionContent>
      <SelectionToolbar />
    </parts.Root>
  );
}

/** The bare root, for arranging `SelectionContent` and `SelectionToolbar` yourself. */
export const SelectionRoot = parts.Root;

/** Holds the text a person selects. Put `SelectionToolbar` right after it. */
export const SelectionContent = parts.Content;

export type SelectionToolbarProps = ComponentProps<typeof parts.Toolbar>;

/** Shown above the selection, with one `SelectionItem` per action unless you pass children. */
export function SelectionToolbar(props: SelectionToolbarProps) {
  return (
    <parts.Toolbar {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindToolbar aria-label={state.label}>
            <For each={state.actions} keyed={(action) => action.id}>
              {(action) => <SelectionItem value={action().id} />}
            </For>
          </KindToolbar>
        ))}
    </parts.Toolbar>
  );
}

export type SelectionItemProps = ComponentProps<typeof parts.Item>;

/** An action, whose `value` is its `id`. Wrap a `KindToolbarButton`, or leave it empty for one with the action's label. */
export function SelectionItem(props: SelectionItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindToolbarButton disabled={!state.canRun} title={state.description}>
            {state.label}
          </KindToolbarButton>
        ))}
    </parts.Item>
  );
}
