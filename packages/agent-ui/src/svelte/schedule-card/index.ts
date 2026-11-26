import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import ScheduleCard from "./ScheduleCard.svelte";
import ScheduleCardDescription from "./ScheduleCardDescription.svelte";
import ScheduleCardEnabled from "./ScheduleCardEnabled.svelte";
import ScheduleCardLast from "./ScheduleCardLast.svelte";
import ScheduleCardLastLink from "./ScheduleCardLastLink.svelte";
import ScheduleCardNext from "./ScheduleCardNext.svelte";
import ScheduleCardRunNow from "./ScheduleCardRunNow.svelte";
import ScheduleCardTitle from "./ScheduleCardTitle.svelte";

/** The bare root, for arranging the parts yourself. */
export const ScheduleCardRoot = parts.Root;
/** The calendar glyph before the title. */
export const ScheduleCardIcon = parts.Icon;
export const ScheduleCardLastMark = parts.LastMark;
/** Calls `onEdit`, as a pencil icon button named "Edit schedule". Rendered only with `onEdit`. */
export const ScheduleCardEdit = parts.Edit;

export {
  ScheduleCard,
  ScheduleCardDescription,
  ScheduleCardEnabled,
  ScheduleCardLast,
  ScheduleCardLastLink,
  ScheduleCardNext,
  ScheduleCardRunNow,
  ScheduleCardTitle,
};
export type ScheduleCardProps = ComponentProps<typeof ScheduleCard>;
export type ScheduleCardTitleProps = ComponentProps<typeof ScheduleCardTitle>;
export type ScheduleCardDescriptionProps = ComponentProps<typeof ScheduleCardDescription>;
export type ScheduleCardNextProps = ComponentProps<typeof ScheduleCardNext>;
export type ScheduleCardLastProps = ComponentProps<typeof ScheduleCardLast>;
export type ScheduleCardLastLinkProps = ComponentProps<typeof ScheduleCardLastLink>;
export type ScheduleCardEnabledProps = ComponentProps<typeof ScheduleCardEnabled>;
export type ScheduleCardRunNowProps = ComponentProps<typeof ScheduleCardRunNow>;
