import { planPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/solid/progress";
import { For, omit } from "solid-js";

const parts = createParts(planPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  progress: "div",
  list: "ol",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  accept: "button",
  outcome: "div",
  "outcome-icon": "span",
});

export type PlanProps = ComponentProps<typeof parts.Root>;

/**
 * The steps an agent plans to take, with how many are done and, while `onAccept` is set, an Accept button that
 * "Accepted" replaces. Any `children` replace the default parts.
 */
export function Plan(props: PlanProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const PlanTrigger = parts.Trigger;
export const PlanIcon = parts.Icon;
export const PlanContent = parts.Content;
export const PlanItemIcon = parts.ItemIcon;
export const PlanOutcomeIcon = parts.OutcomeIcon;

export type PlanTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Plan", unless you pass children. */
export function PlanTitle(props: PlanTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export type PlanMetaProps = ComponentProps<typeof parts.Meta>;

/** How many items are done, as "3 of 5", unless you pass children. */
export function PlanMeta(props: PlanMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state) => `${state.done} of ${state.total}`)}
    </parts.Meta>
  );
}

export type PlanProgressProps = ComponentProps<typeof parts.Progress>;

/**
 * A UI SDK Progress of the items done, labeled "3 of 5 steps", unless you pass children. Not in the default parts,
 * whose meta says the same.
 */
export function PlanProgress(props: PlanProgressProps) {
  return (
    <parts.Progress {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Progress value={state.value}>
            <ProgressLabel>{state.label}</ProgressLabel>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ))}
    </parts.Progress>
  );
}

export type PlanListProps = ComponentProps<typeof parts.List>;

/** An item for each of the `items`, unless you pass children. */
export function PlanList(props: PlanListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.items} keyed={(item) => item.id}>
            {(item) => <PlanItem value={item().id} />}
          </For>
        ))}
    </parts.List>
  );
}

export type PlanItemProps = ComponentProps<typeof parts.Item>;

/** The item whose `id` is `value`. Without children, it shows the item's mark, title and description. */
export function PlanItem(props: PlanItemProps) {
  return <parts.Item {...omit(props, "children")}>{props.children ?? <DefaultItemParts />}</parts.Item>;
}

export type PlanItemTitleProps = ComponentProps<typeof parts.ItemTitle>;

/** The item's `title`, unless you pass children. */
export function PlanItemTitle(props: PlanItemTitleProps) {
  return (
    <parts.ItemTitle {...omit(props, "children")}>
      {props.children ?? ((state) => state.title)}
    </parts.ItemTitle>
  );
}

export type PlanItemDescriptionProps = ComponentProps<typeof parts.ItemDescription>;

/** The item's `description`, unless you pass children. Rendered only while the item has one. */
export function PlanItemDescription(props: PlanItemDescriptionProps) {
  return (
    <parts.ItemDescription {...omit(props, "children")}>
      {props.children ?? ((state) => state.description)}
    </parts.ItemDescription>
  );
}

export type PlanAcceptProps = ComponentProps<typeof parts.Accept>;

/**
 * Calls `onAccept`. Reads "Accept plan", with a running mark while pending, unless you pass children. Rendered only
 * while `onAccept` is set and the plan isn't accepted.
 */
export function PlanAccept(props: PlanAcceptProps) {
  return (
    <parts.Accept {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          Accept plan
        </>
      )}
    </parts.Accept>
  );
}

export type PlanOutcomeProps = ComponentProps<typeof parts.Outcome>;

/** "Accepted" with a complete mark, in Accept's place once the plan is accepted, unless you pass children. */
export function PlanOutcome(props: PlanOutcomeProps) {
  return (
    <parts.Outcome {...omit(props, "children")}>
      {props.children ?? (
        <>
          <PlanOutcomeIcon />
          Accepted
        </>
      )}
    </parts.Outcome>
  );
}

function DefaultItemParts() {
  return (
    <>
      <PlanItemIcon />
      <PlanItemTitle />
      <PlanItemDescription />
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <PlanTrigger>
        <PlanIcon />
        <PlanTitle />
        <PlanMeta />
      </PlanTrigger>
      <PlanContent>
        <PlanList />
      </PlanContent>
      <PlanAccept />
      <PlanOutcome />
    </>
  );
}
