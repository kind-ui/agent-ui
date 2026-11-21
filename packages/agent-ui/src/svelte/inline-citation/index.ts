import type { ComponentProps } from "svelte";
import InlineCitation from "./InlineCitation.svelte";
import InlineCitationCarousel from "./InlineCitationCarousel.svelte";
import InlineCitationContent from "./InlineCitationContent.svelte";
import InlineCitationHost from "./InlineCitationHost.svelte";
import InlineCitationIcon from "./InlineCitationIcon.svelte";
import InlineCitationIndex from "./InlineCitationIndex.svelte";
import InlineCitationItem from "./InlineCitationItem.svelte";
import InlineCitationNext from "./InlineCitationNext.svelte";
import InlineCitationPrevious from "./InlineCitationPrevious.svelte";
import InlineCitationSnippet from "./InlineCitationSnippet.svelte";
import InlineCitationSourceTitle from "./InlineCitationSourceTitle.svelte";
import InlineCitationTrigger from "./InlineCitationTrigger.svelte";
import { parts } from "./parts.js";

/** Links to the source's `url` in a new tab; an `a` without `href`, which is text, when the URL isn't safe. */
export const InlineCitationLink = parts.Link;

export {
  InlineCitation,
  InlineCitationCarousel,
  InlineCitationContent,
  InlineCitationHost,
  InlineCitationIcon,
  InlineCitationIndex,
  InlineCitationItem,
  InlineCitationNext,
  InlineCitationPrevious,
  InlineCitationSnippet,
  InlineCitationSourceTitle,
  InlineCitationTrigger,
};

export type InlineCitationProps = ComponentProps<typeof InlineCitation>;
export type InlineCitationTriggerProps = ComponentProps<typeof InlineCitationTrigger>;
export type InlineCitationContentProps = ComponentProps<typeof InlineCitationContent>;
export type InlineCitationCarouselProps = ComponentProps<typeof InlineCitationCarousel>;
export type InlineCitationItemProps = ComponentProps<typeof InlineCitationItem>;
export type InlineCitationIconProps = ComponentProps<typeof InlineCitationIcon>;
export type InlineCitationHostProps = ComponentProps<typeof InlineCitationHost>;
export type InlineCitationSourceTitleProps = ComponentProps<typeof InlineCitationSourceTitle>;
export type InlineCitationSnippetProps = ComponentProps<typeof InlineCitationSnippet>;
export type InlineCitationIndexProps = ComponentProps<typeof InlineCitationIndex>;
