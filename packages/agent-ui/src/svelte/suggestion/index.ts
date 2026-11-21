import type { ComponentProps } from "svelte";
import Suggestion from "./Suggestion.svelte";
import SuggestionChip from "./SuggestionChip.svelte";
import SuggestionControls from "./SuggestionControls.svelte";
import SuggestionItem from "./SuggestionItem.svelte";
import SuggestionNext from "./SuggestionNext.svelte";
import SuggestionPrevious from "./SuggestionPrevious.svelte";
import SuggestionViewport from "./SuggestionViewport.svelte";

export {
  Suggestion,
  SuggestionChip,
  SuggestionControls,
  SuggestionItem,
  SuggestionNext,
  SuggestionPrevious,
  SuggestionViewport,
};
export type SuggestionProps = ComponentProps<typeof Suggestion>;
export type SuggestionItemProps = ComponentProps<typeof SuggestionItem>;
export type SuggestionChipProps = ComponentProps<typeof SuggestionChip>;
