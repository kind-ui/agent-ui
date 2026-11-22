import { inlineCitationPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/solid/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from "@ui-sdk/solid/carousel";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";

// Every part is a `span`, so a citation is valid inside a paragraph.
const parts = createParts(inlineCitationPrimitive, {
  root: "span",
  trigger: "button",
  content: "span",
  carousel: "span",
  item: "span",
  link: "a",
  icon: "span",
  host: "span",
  "source-title": "span",
  snippet: "span",
  index: "span",
});

const span = (props: JSX.HTMLAttributes<HTMLSpanElement>) => <span {...props} />;

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

export type InlineCitationProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

/**
 * A marker in running text for the sources a sentence came from, with a card that opens on hover, keyboard focus and
 * press. More than one source pages in the card. Any `children` replace the marker and the card.
 */
export function InlineCitation(props: InlineCitationProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(state) =>
        props.children ?? (
          <>
            <InlineCitationTrigger />
            <InlineCitationContent>
              <Switch>
                <Match when={state.ids.length > 1}>
                  <InlineCitationCarousel />
                </Match>
                <Match when={state.ids[0]}>{(id) => <InlineCitationItem value={id()} />}</Match>
              </Switch>
            </InlineCitationContent>
          </>
        )
      }
    </parts.Root>
  );
}

export type InlineCitationTriggerProps = ComponentProps<typeof parts.Trigger>;

/** The marker, which opens the card. Reads the `label` unless you pass children. */
export function InlineCitationTrigger(props: InlineCitationTriggerProps) {
  return (
    <parts.Trigger {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Trigger>
  );
}

export type InlineCitationContentProps = ComponentProps<typeof parts.Content>;

/** The card. Leaves focus on the marker when it opens. */
export function InlineCitationContent(props: InlineCitationContentProps) {
  return <parts.Content initialFocus="none" {...props} />;
}

export type InlineCitationCarouselProps = Omit<ComponentProps<typeof parts.Carousel>, "children"> & {
  children?: JSX.Element;
};

/**
 * UI SDK's Carousel, a slide per source with Previous, the page and Next below. Rendered only for more than one
 * source. Any `children` replace the slides and controls, inside the Carousel.
 */
export function InlineCitationCarousel(props: InlineCitationCarouselProps) {
  return (
    <parts.Carousel {...omit(props, "children")}>
      {(state) => (
        <Carousel
          render={span}
          controller={state.controller}
          defaultPage={state.defaultPage}
          drag={false}
          aria-label="Sources"
        >
          {props.children ?? (
            <>
              <CarouselViewport render={span}>
                <CarouselContent render={span}>
                  <For each={state.ids}>
                    {(id) => (
                      <CarouselItem render={span}>
                        <InlineCitationItem value={id} />
                      </CarouselItem>
                    )}
                  </For>
                </CarouselContent>
              </CarouselViewport>
              <span data-inline-citation-controls="">
                <InlineCitationPrevious />
                <InlineCitationIndex />
                <InlineCitationNext />
              </span>
            </>
          )}
        </Carousel>
      )}
    </parts.Carousel>
  );
}

export type InlineCitationItemProps = ComponentProps<typeof parts.Item>;

/**
 * The source whose `id` is `value`. Without children, it shows its icon, title and host name, a link when its `url`
 * is safe, then its snippet.
 */
export function InlineCitationItem(props: InlineCitationItemProps) {
  return <parts.Item {...omit(props, "children")}>{props.children ?? <DefaultItemParts />}</parts.Item>;
}

/** Links to the source's `url` in a new tab; an `a` without `href`, which is text, when the URL isn't safe. */
export const InlineCitationLink = parts.Link;

export type InlineCitationIconProps = ComponentProps<typeof parts.Icon>;

/** A UI SDK Avatar of the source's `favicon`, showing a link glyph until it loads or without one. */
export function InlineCitationIcon(props: InlineCitationIconProps) {
  return (
    <parts.Icon {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Avatar>
            <Show when={state.favicon}>{(favicon) => <AvatarImage src={favicon()} alt="" />}</Show>
            <AvatarFallback />
          </Avatar>
        ))}
    </parts.Icon>
  );
}

export type InlineCitationHostProps = ComponentProps<typeof parts.Host>;

/** The host name of the source's `url`, unless you pass children. Rendered only with a safe `url`. */
export function InlineCitationHost(props: InlineCitationHostProps) {
  return <parts.Host {...omit(props, "children")}>{props.children ?? ((state) => state.host)}</parts.Host>;
}

export type InlineCitationSourceTitleProps = ComponentProps<typeof parts.SourceTitle>;

/** The source's `title`, unless you pass children. */
export function InlineCitationSourceTitle(props: InlineCitationSourceTitleProps) {
  return (
    <parts.SourceTitle {...omit(props, "children")}>
      {props.children ?? ((state) => state.title)}
    </parts.SourceTitle>
  );
}

export type InlineCitationSnippetProps = ComponentProps<typeof parts.Snippet>;

/** The source's `snippet`, unless you pass children. Rendered only with a `snippet`. */
export function InlineCitationSnippet(props: InlineCitationSnippetProps) {
  return (
    <parts.Snippet {...omit(props, "children")}>{props.children ?? ((state) => state.snippet)}</parts.Snippet>
  );
}

export type InlineCitationIndexProps = ComponentProps<typeof parts.Index>;

/** Which source the card shows, like "1 of 3", unless you pass children. */
export function InlineCitationIndex(props: InlineCitationIndexProps) {
  return <parts.Index {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Index>;
}

// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent pages with the
// citation's own `next` and `previous`.

/** Shows the previous source. */
export function InlineCitationPrevious(props: ComponentProps<typeof CarouselPrevious>) {
  return (
    <CarouselPrevious
      aria-label="Previous source"
      data-agent-hidden=""
      data-kind-icon-button=""
      {...omit(props, "children")}
    >
      {props.children ?? chevronLeft()}
    </CarouselPrevious>
  );
}

/** Shows the next source. */
export function InlineCitationNext(props: ComponentProps<typeof CarouselNext>) {
  return (
    <CarouselNext
      aria-label="Next source"
      data-agent-hidden=""
      data-kind-icon-button=""
      {...omit(props, "children")}
    >
      {props.children ?? chevronRight()}
    </CarouselNext>
  );
}

function DefaultItemParts() {
  return (
    <>
      <InlineCitationLink>
        <InlineCitationIcon />
        <InlineCitationSourceTitle />
        <InlineCitationHost />
      </InlineCitationLink>
      <InlineCitationSnippet />
    </>
  );
}
