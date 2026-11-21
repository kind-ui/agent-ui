import { type ConversationSearchInputState, conversationSearchPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Input, InputGroup } from "@ui-sdk/solid/input";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(conversationSearchPrimitive, {
  root: "div",
  input: "div",
  count: "span",
  previous: "button",
  next: "button",
  close: "button",
});

export type ConversationSearchProps = ComponentProps<typeof parts.Root>;

/**
 * A find bar over a Conversation's messages: the field with its count, Previous, Next and Close, unless you pass
 * children. Pass `conversation` the Conversation's controller and wire `onMarksChange` to its `marks`.
 */
export function ConversationSearch(props: ConversationSearchProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ConversationSearchInput />
          <ConversationSearchPrevious />
          <ConversationSearchNext />
          <ConversationSearchClose />
        </>
      )}
    </parts.Root>
  );
}

const searchField = (state: ConversationSearchInputState) => (
  <InputGroup>
    <Input
      type="search"
      controller={state.controller}
      defaultValue={state.defaultValue}
      aria-label={state.label}
      aria-describedby={state.describedBy}
      placeholder="Find…"
      data-agent-hidden=""
    />
    <ConversationSearchCount />
  </InputGroup>
);

export type ConversationSearchInputProps = ComponentProps<typeof parts.Input>;

/** The search field with its count, unless you pass children. Pass the state to UI SDK Input. */
export function ConversationSearchInput(props: ConversationSearchInputProps) {
  return <parts.Input {...omit(props, "children")}>{props.children ?? searchField}</parts.Input>;
}

export type ConversationSearchCountProps = ComponentProps<typeof parts.Count>;

/** "3 of 12", or "0 of 0" without a match, while there's a search, unless you pass children. */
export function ConversationSearchCount(props: ConversationSearchCountProps) {
  return (
    <parts.Count {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Count>
  );
}

/** Moves to the previous match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchPrevious = parts.Previous;
/** Moves to the next match. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchNext = parts.Next;
/** Closes the bar and moves focus back where it was. Its icon is drawn in CSS; render it empty. */
export const ConversationSearchClose = parts.Close;
