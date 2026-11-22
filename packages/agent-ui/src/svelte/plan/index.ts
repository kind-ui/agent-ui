import type { ComponentProps } from "svelte";
import Plan from "./Plan.svelte";
import PlanAccept from "./PlanAccept.svelte";
import PlanItem from "./PlanItem.svelte";
import PlanItemDescription from "./PlanItemDescription.svelte";
import PlanItemTitle from "./PlanItemTitle.svelte";
import PlanList from "./PlanList.svelte";
import PlanMeta from "./PlanMeta.svelte";
import PlanOutcome from "./PlanOutcome.svelte";
import PlanProgress from "./PlanProgress.svelte";
import PlanTitle from "./PlanTitle.svelte";
import { parts } from "./parts.js";

export {
  Plan,
  PlanAccept,
  PlanItem,
  PlanItemDescription,
  PlanItemTitle,
  PlanList,
  PlanMeta,
  PlanOutcome,
  PlanProgress,
  PlanTitle,
};
export const PlanTrigger = parts.Trigger;
export const PlanIcon = parts.Icon;
export const PlanContent = parts.Content;
export const PlanItemIcon = parts.ItemIcon;
export const PlanOutcomeIcon = parts.OutcomeIcon;

export type PlanProps = ComponentProps<typeof Plan>;
export type PlanTitleProps = ComponentProps<typeof PlanTitle>;
export type PlanMetaProps = ComponentProps<typeof PlanMeta>;
export type PlanProgressProps = ComponentProps<typeof PlanProgress>;
export type PlanListProps = ComponentProps<typeof PlanList>;
export type PlanItemProps = ComponentProps<typeof PlanItem>;
export type PlanItemTitleProps = ComponentProps<typeof PlanItemTitle>;
export type PlanItemDescriptionProps = ComponentProps<typeof PlanItemDescription>;
export type PlanAcceptProps = ComponentProps<typeof PlanAccept>;
export type PlanOutcomeProps = ComponentProps<typeof PlanOutcome>;
