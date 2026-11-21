import { sourcesPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/solid/avatar";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

const parts = createParts(sourcesPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  list: "ul",
  item: "li",
  link: "a",
  icon: "span",
  title: "span",
  host: "span",
  snippet: "p",
});

export type SourcesProps = ComponentProps<typeof parts.Root>;

/**
 * The sources a response used, as "Used N sources" that opens a list of links. Any `children` replace the default
 * trigger and content.
 */
export function Sources(props: SourcesProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const SourcesContent = parts.Content;
export const SourcesLink = parts.Link;

export type SourcesTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Shows and hides the list. Reads the `label`, else "Used N sources", unless you pass children. */
export function SourcesTrigger(props: SourcesTriggerProps) {
  return (
    <parts.Trigger {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Trigger>
  );
}

export type SourcesListProps = ComponentProps<typeof parts.List>;

/** An item for each of the `sources`, unless you pass children. */
export function SourcesList(props: SourcesListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.sources} keyed={(source) => source.id}>
            {(source) => <SourcesItem value={source().id} />}
          </For>
        ))}
    </parts.List>
  );
}

export type SourcesItemProps = ComponentProps<typeof parts.Item>;

/** The source whose `id` is `value`. Without children, it shows a link to it and its snippet. */
export function SourcesItem(props: SourcesItemProps) {
  return <parts.Item {...omit(props, "children")}>{props.children ?? <DefaultItemParts />}</parts.Item>;
}

export type SourcesIconProps = ComponentProps<typeof parts.Icon>;

/** A UI SDK Avatar of the source's `favicon`, showing a link glyph until it loads or without one. */
export function SourcesIcon(props: SourcesIconProps) {
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

export type SourcesTitleProps = ComponentProps<typeof parts.Title>;

/** The source's `title`, unless you pass children. */
export function SourcesTitle(props: SourcesTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export type SourcesHostProps = ComponentProps<typeof parts.Host>;

/** The host name of the source's `url`, unless you pass children. Rendered only with a safe `url`. */
export function SourcesHost(props: SourcesHostProps) {
  return <parts.Host {...omit(props, "children")}>{props.children ?? ((state) => state.host)}</parts.Host>;
}

export type SourcesSnippetProps = ComponentProps<typeof parts.Snippet>;

/** The source's `snippet`, unless you pass children. Rendered only with a `snippet`. */
export function SourcesSnippet(props: SourcesSnippetProps) {
  return (
    <parts.Snippet {...omit(props, "children")}>{props.children ?? ((state) => state.snippet)}</parts.Snippet>
  );
}

function DefaultItemParts() {
  return (
    <>
      <SourcesLink>
        <SourcesIcon />
        <SourcesTitle />
        <SourcesHost />
      </SourcesLink>
      <SourcesSnippet />
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <SourcesTrigger />
      <SourcesContent>
        <SourcesList />
      </SourcesContent>
    </>
  );
}
