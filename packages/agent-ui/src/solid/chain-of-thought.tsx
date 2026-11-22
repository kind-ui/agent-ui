import type { ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
import { chainOfThoughtPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(chainOfThoughtPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  list: "ol",
  item: "li",
  "item-trigger": "button",
  "item-icon": "span",
  "item-title": "span",
  "item-meta": "span",
  "item-content": "div",
});

export type ChainOfThoughtProps = ComponentProps<typeof parts.Root>;

/**
 * A summary of the steps an agent took, which expands into them. Any `children` replace the default trigger and
 * content.
 */
export function ChainOfThought(props: ChainOfThoughtProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const ChainOfThoughtTrigger = parts.Trigger;
export const ChainOfThoughtIcon = parts.Icon;
export const ChainOfThoughtContent = parts.Content;
export const ChainOfThoughtItemIcon = parts.ItemIcon;
export const ChainOfThoughtItemContent = parts.ItemContent;

export type ChainOfThoughtTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "N steps", unless you pass children. */
export function ChainOfThoughtTitle(props: ChainOfThoughtTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type ChainOfThoughtMetaProps = ComponentProps<typeof parts.Meta>;

/** The `durationSeconds`, as "N s", unless you pass children. */
export function ChainOfThoughtMeta(props: ChainOfThoughtMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { duration: string }) => state.duration)}
    </parts.Meta>
  );
}

export type ChainOfThoughtListProps = ComponentProps<typeof parts.List>;

/** An item for each step, unless you pass children. */
export function ChainOfThoughtList(props: ChainOfThoughtListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state: { steps: ChainOfThoughtStep[] }) => (
          <For each={state.steps} keyed={(step) => step.id}>
            {(step) => <ChainOfThoughtItem value={step().id} />}
          </For>
        ))}
    </parts.List>
  );
}

export type ChainOfThoughtItemProps = ComponentProps<typeof parts.Item>;

/** The step whose `id` is `value`. Without children, it shows the step's trigger. */
export function ChainOfThoughtItem(props: ChainOfThoughtItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>{props.children ?? <ChainOfThoughtItemTrigger />}</parts.Item>
  );
}

export type ChainOfThoughtItemTriggerProps = ComponentProps<typeof parts.ItemTrigger>;

/** Opens and closes the step's content. Without children, it shows the step's icon, title and duration. */
export function ChainOfThoughtItemTrigger(props: ChainOfThoughtItemTriggerProps) {
  return (
    <parts.ItemTrigger {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ChainOfThoughtItemIcon />
          <ChainOfThoughtItemTitle />
          <ChainOfThoughtItemMeta />
        </>
      )}
    </parts.ItemTrigger>
  );
}

export type ChainOfThoughtItemTitleProps = ComponentProps<typeof parts.ItemTitle>;

/** The step's `title`, unless you pass children. */
export function ChainOfThoughtItemTitle(props: ChainOfThoughtItemTitleProps) {
  return (
    <parts.ItemTitle {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.ItemTitle>
  );
}

export type ChainOfThoughtItemMetaProps = ComponentProps<typeof parts.ItemMeta>;

/** The step's `durationSeconds`, as "N s", unless you pass children. */
export function ChainOfThoughtItemMeta(props: ChainOfThoughtItemMetaProps) {
  return (
    <parts.ItemMeta {...omit(props, "children")}>
      {props.children ?? ((state: { duration: string }) => state.duration)}
    </parts.ItemMeta>
  );
}

function DefaultParts() {
  return (
    <>
      <ChainOfThoughtTrigger>
        <ChainOfThoughtIcon />
        <ChainOfThoughtTitle />
        <ChainOfThoughtMeta />
      </ChainOfThoughtTrigger>
      <ChainOfThoughtContent>
        <ChainOfThoughtList />
      </ChainOfThoughtContent>
    </>
  );
}
