import { documentPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";
import { CodeBlock } from "./code-block.js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "./internal/scroll-area.js";
import { KindToolbar, KindToolbarButton } from "./internal/toolbar.js";
import { Markdown } from "./markdown.js";

const parts = createParts(documentPrimitive, {
  root: "div",
  header: "div",
  title: "span",
  meta: "span",
  toolbar: "div",
  copy: "span",
  download: "span",
  body: "div",
  content: "div",
  expand: "button",
});

export type DocumentProps = ComponentProps<typeof parts.Root>;

/**
 * A document as a card: its title, kind and size, Copy and Download, and a preview that expands. Any `children`
 * replace the default header and body.
 */
export function Document(props: DocumentProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

/** Holds the title, the meta line and the toolbar. */
export const DocumentHeader = parts.Header;

export type DocumentTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. */
export function DocumentTitle(props: DocumentTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Title>;
}

export type DocumentMetaProps = ComponentProps<typeof parts.Meta>;

/** What the document is and its size, like "Markdown · 2.4 kB", unless you pass children. */
export function DocumentMeta(props: DocumentMetaProps) {
  return <parts.Meta {...omit(props, "children")}>{props.children ?? ((state) => state.meta)}</parts.Meta>;
}

export type DocumentToolbarProps = ComponentProps<typeof parts.Toolbar>;

/** A `KindToolbar` with Copy and a Download for each of the `downloads`, unless you pass children. */
export function DocumentToolbar(props: DocumentToolbarProps) {
  return (
    <parts.Toolbar {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindToolbar aria-label="Document actions">
            <DocumentCopy />
            <Show when={state.canDownload}>
              <Show
                when={state.downloads.length > 1}
                fallback={<DocumentDownload value={state.downloads[0]?.id} />}
              >
                <For each={state.downloads} keyed={(download) => download.id}>
                  {(download) => <DocumentDownload value={download().id} />}
                </For>
              </Show>
            </Show>
          </KindToolbar>
        ))}
    </parts.Toolbar>
  );
}

export type DocumentCopyProps = ComponentProps<typeof parts.Copy>;

/** Copies the `content`. Wraps a `KindToolbarButton` named "Copy", unless you pass children. */
export function DocumentCopy(props: DocumentCopyProps) {
  return (
    <parts.Copy {...omit(props, "children")}>
      {props.children ?? <KindToolbarButton aria-label="Copy" />}
    </parts.Copy>
  );
}

export type DocumentDownloadProps = ComponentProps<typeof parts.Download>;

/**
 * Calls `onDownload` with its `value`, a download's `id`. Wraps a `KindToolbarButton` named "Download", or showing
 * the download's `label` when there are several, unless you pass children.
 */
export function DocumentDownload(props: DocumentDownloadProps) {
  return (
    <parts.Download {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindToolbarButton aria-label={state.label ? `Download ${state.label}` : "Download"}>
            <Show when={state.label}>
              <span data-document-download-label="">{state.label}</span>
            </Show>
          </KindToolbarButton>
        ))}
    </parts.Download>
  );
}

export type DocumentBodyProps = ComponentProps<typeof parts.Body>;

/** The preview: a `KindScrollArea` holding the content, followed by Show more, unless you pass children. */
export function DocumentBody(props: DocumentBodyProps) {
  return (
    <parts.Body {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <KindScrollArea stickToEnd={state.streaming}>
              <KindScrollAreaViewport>
                <KindScrollAreaContent>
                  <DocumentContent />
                </KindScrollAreaContent>
              </KindScrollAreaViewport>
              <KindScrollAreaScrollbar>
                <KindScrollAreaThumb />
              </KindScrollAreaScrollbar>
            </KindScrollArea>
            <DocumentExpand />
          </>
        ))}
    </parts.Body>
  );
}

export type DocumentContentProps = ComponentProps<typeof parts.Content>;

/**
 * The `content` as its `format` says: Markdown, a Code Block without its header, or wrapped plain text, unless you
 * pass children.
 */
export function DocumentContent(props: DocumentContentProps) {
  return (
    <parts.Content {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Switch fallback={<pre>{state.content}</pre>}>
            <Match when={state.format === "markdown"}>
              <Markdown source={state.content} streaming={state.streaming} highlight={state.highlight} />
            </Match>
            <Match when={state.format === "code"}>
              <CodeBlock
                header={false}
                code={state.content}
                language={state.language}
                streaming={state.streaming}
                highlight={state.highlight}
              />
            </Match>
          </Switch>
        ))}
    </parts.Content>
  );
}

export type DocumentExpandProps = ComponentProps<typeof parts.Expand>;

/** "Show more", or "Show less" while expanded. Rendered only while the content overflows the preview. */
export function DocumentExpand(props: DocumentExpandProps) {
  return (
    <parts.Expand {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Expand>
  );
}

function DefaultParts() {
  return (
    <>
      <DocumentHeader>
        <DocumentTitle />
        <DocumentMeta />
        <DocumentToolbar />
      </DocumentHeader>
      <DocumentBody />
    </>
  );
}
