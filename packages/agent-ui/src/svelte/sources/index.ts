import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Sources from "./Sources.svelte";
import SourcesHost from "./SourcesHost.svelte";
import SourcesIcon from "./SourcesIcon.svelte";
import SourcesItem from "./SourcesItem.svelte";
import SourcesList from "./SourcesList.svelte";
import SourcesSnippet from "./SourcesSnippet.svelte";
import SourcesTitle from "./SourcesTitle.svelte";
import SourcesTrigger from "./SourcesTrigger.svelte";

export const SourcesContent = parts.Content;
export const SourcesLink = parts.Link;

export {
  Sources,
  SourcesHost,
  SourcesIcon,
  SourcesItem,
  SourcesList,
  SourcesSnippet,
  SourcesTitle,
  SourcesTrigger,
};

export type SourcesProps = ComponentProps<typeof Sources>;
export type SourcesTriggerProps = ComponentProps<typeof SourcesTrigger>;
export type SourcesListProps = ComponentProps<typeof SourcesList>;
export type SourcesItemProps = ComponentProps<typeof SourcesItem>;
export type SourcesIconProps = ComponentProps<typeof SourcesIcon>;
export type SourcesTitleProps = ComponentProps<typeof SourcesTitle>;
export type SourcesHostProps = ComponentProps<typeof SourcesHost>;
export type SourcesSnippetProps = ComponentProps<typeof SourcesSnippet>;
