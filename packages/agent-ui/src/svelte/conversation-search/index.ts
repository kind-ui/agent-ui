import type { ComponentProps } from "svelte";
import ConversationSearch from "./ConversationSearch.svelte";
import ConversationSearchCount from "./ConversationSearchCount.svelte";
import ConversationSearchInput from "./ConversationSearchInput.svelte";
import { parts } from "./parts.js";

/** Moves to the previous match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchPrevious = parts.Previous;
/** Moves to the next match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchNext = parts.Next;
/** Closes the bar and moves focus back where it was. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchClose = parts.Close;

export { ConversationSearch, ConversationSearchCount, ConversationSearchInput };
export type ConversationSearchProps = ComponentProps<typeof ConversationSearch>;
export type ConversationSearchInputProps = ComponentProps<typeof ConversationSearchInput>;
export type ConversationSearchCountProps = ComponentProps<typeof ConversationSearchCount>;
