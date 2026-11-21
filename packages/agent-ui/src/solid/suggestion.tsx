import { suggestionPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, children as resolveChildren, Show } from "solid-js";
import {
  KindCarousel,
  KindCarouselContent,
  KindCarouselItem,
  KindCarouselNext,
  KindCarouselPrevious,
  KindCarouselViewport,
} from "./internal/carousel.js";

const parts = createParts(suggestionPrimitive, { root: "div", item: "button" });

// Lucide "chevron-left" and "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);
const chevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export type SuggestionProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

// Resolves the caller's children once, where they're placed, so they're built inside the Carousel when there is one.
function Rows(props: { children?: JSX.Element; fallback: () => JSX.Element }) {
  const resolved = resolveChildren(() => props.children);
  return (
    <Show when={resolved() !== undefined} fallback={props.fallback()}>
      {resolved()}
    </Show>
  );
}

/**
 * A row of prompts a person can send in one press. It scrolls sideways when the prompts don't fit, with Previous and
 * Next beside it, or wraps onto more lines with `layout="wrap"`. Any `children` replace the row and its buttons:
 * `SuggestionItem`s inside the Carousel, or `SuggestionChip`s when it wraps.
 */
export function Suggestion(props: SuggestionProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(state) => (
        <Show
          when={state.layout === "wrap"}
          fallback={
            <KindCarousel aria-label={state.label} slidesPerPage="auto" dragFree>
              <Rows
                fallback={() => (
                  <>
                    <SuggestionViewport>
                      <For each={state.suggestions} keyed={(suggestion) => suggestion.id}>
                        {(suggestion) => <SuggestionItem value={suggestion().id} />}
                      </For>
                    </SuggestionViewport>
                    <SuggestionControls />
                  </>
                )}
              >
                {props.children}
              </Rows>
            </KindCarousel>
          }
        >
          <Rows
            fallback={() => (
              <For each={state.suggestions} keyed={(suggestion) => suggestion.id}>
                {(suggestion) => <SuggestionChip value={suggestion().id} />}
              </For>
            )}
          >
            {props.children}
          </Rows>
        </Show>
      )}
    </parts.Root>
  );
}

/** The row that scrolls, holding the suggestions. */
export function SuggestionViewport(
  props: Omit<ComponentProps<typeof KindCarouselViewport>, "children"> & { children?: JSX.Element },
) {
  return (
    <KindCarouselViewport {...omit(props, "children")}>
      <KindCarouselContent>{props.children}</KindCarouselContent>
    </KindCarouselViewport>
  );
}

export type SuggestionItemProps = ComponentProps<typeof parts.Item>;

/** A suggestion in the Carousel: a `SuggestionChip` in its slide. */
export function SuggestionItem(props: SuggestionItemProps) {
  return (
    <KindCarouselItem>
      <SuggestionChip {...props} />
    </KindCarouselItem>
  );
}

export type SuggestionChipProps = ComponentProps<typeof parts.Item>;

/** A suggestion's button, whose `value` is its `id`. Reads its label and description unless you pass children. */
export function SuggestionChip(props: SuggestionChipProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <span data-suggestion-label="">{state.label}</span>
            <Show when={state.description !== undefined}>
              {" "}
              <span data-suggestion-description="">{state.description}</span>
            </Show>
          </>
        ))}
    </parts.Item>
  );
}

/** Holds Previous and Next, unless you pass children, and hides them while every suggestion fits. */
export function SuggestionControls(props: ComponentProps<"div">) {
  return (
    <div data-suggestion-controls="" {...omit(props, "children")}>
      {props.children ?? (
        <>
          <SuggestionPrevious />
          <SuggestionNext />
        </>
      )}
    </div>
  );
}

// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent picks any
// suggestion by its id with the Suggestion's own `pick`, wherever it has scrolled.

/** Scrolls back to earlier suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. */
export function SuggestionPrevious(props: ComponentProps<typeof KindCarouselPrevious>) {
  return (
    <KindCarouselPrevious aria-label="Previous suggestions" data-agent-hidden="" {...omit(props, "children")}>
      {props.children ?? chevronLeft()}
    </KindCarouselPrevious>
  );
}

/** Scrolls on to later suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. */
export function SuggestionNext(props: ComponentProps<typeof KindCarouselNext>) {
  return (
    <KindCarouselNext aria-label="Next suggestions" data-agent-hidden="" {...omit(props, "children")}>
      {props.children ?? chevronRight()}
    </KindCarouselNext>
  );
}
