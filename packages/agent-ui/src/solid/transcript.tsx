import { transcriptPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Input, InputClear, InputGroup } from "@ui-sdk/solid/input";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

const parts = createParts(transcriptPrimitive, {
  root: "div",
  search: "div",
  count: "span",
  viewport: "div",
  list: "div",
  segment: "div",
  speaker: "span",
  seek: "button",
  time: "span",
  text: "p",
  word: "span",
});

export type TranscriptProps = ComponentProps<typeof parts.Root>;

/**
 * Speaker-labelled, timed segments with a search, marking the segment and word playing at `currentTime`. Any
 * `children` replace the default parts.
 */
export function Transcript(props: TranscriptProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <TranscriptSearch />
          <TranscriptViewport>
            <TranscriptList />
          </TranscriptViewport>
        </>
      )}
    </parts.Root>
  );
}

/** A time as a button that seeks to its segment, rendered only while `onSeek` is set. Holds a `TranscriptTime`. */
export const TranscriptSeek = parts.Seek;
/** Scrolls the segments. Holds a `TranscriptList`. */
export const TranscriptViewport = parts.Viewport;

function Marked(props: { segments: readonly { text: string; match: boolean }[] }) {
  return (
    <For each={props.segments} keyed={false}>
      {(segment) => (
        <Show when={segment().match} fallback={segment().text}>
          <mark>{segment().text}</mark>
        </Show>
      )}
    </For>
  );
}

export type TranscriptSearchProps = ComponentProps<typeof parts.Search>;

/** A search field with the match count and a clear button, unless you pass children. Pass the state to UI SDK Input. */
export function TranscriptSearch(props: TranscriptSearchProps) {
  return (
    <parts.Search {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <InputGroup>
            <Input
              type="search"
              controller={state.controller}
              defaultValue={state.defaultValue}
              aria-label={state.label}
              placeholder="Search"
              data-agent-hidden=""
            />
            <TranscriptCount />
            <InputClear aria-label="Clear search" data-agent-hidden="" />
          </InputGroup>
        ))}
    </parts.Search>
  );
}

export type TranscriptCountProps = ComponentProps<typeof parts.Count>;

/** "3 matches" while there's a search, unless you pass children. */
export function TranscriptCount(props: TranscriptCountProps) {
  return <parts.Count {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Count>;
}

export type TranscriptListProps = ComponentProps<typeof parts.List>;

/** A `TranscriptSegment` for each segment in view, keyed by its id, unless you pass children. */
export function TranscriptList(props: TranscriptListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.rows} keyed={(row) => row.key}>
            {(row) => <TranscriptSegment value={row().key} />}
          </For>
        ))}
    </parts.List>
  );
}

export type TranscriptSegmentProps = ComponentProps<typeof parts.Segment>;

/** The segment whose id is `value`: its speaker, its time, and its text, unless you pass children. */
export function TranscriptSegment(props: TranscriptSegmentProps) {
  return (
    <parts.Segment {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <div data-transcript-header="">
              <TranscriptSpeaker />
              <Show when={state.canSeek} fallback={<TranscriptTime />}>
                <TranscriptSeek>
                  <TranscriptTime />
                </TranscriptSeek>
              </Show>
            </div>
            <TranscriptText />
          </>
        ))}
    </parts.Segment>
  );
}

export type TranscriptSpeakerProps = ComponentProps<typeof parts.Speaker>;

/** The speaker, with what the search matched marked, unless you pass children. */
export function TranscriptSpeaker(props: TranscriptSpeakerProps) {
  return (
    <parts.Speaker {...omit(props, "children")}>
      {props.children ?? ((state) => <Marked segments={state.speaker} />)}
    </parts.Speaker>
  );
}

export type TranscriptTimeProps = ComponentProps<typeof parts.Time>;

/** When the segment starts, like "1:05", unless you pass children. */
export function TranscriptTime(props: TranscriptTimeProps) {
  return <parts.Time {...omit(props, "children")}>{props.children ?? ((state) => state.time)}</parts.Time>;
}

export type TranscriptTextProps = ComponentProps<typeof parts.Text>;

/** A `TranscriptWord` for each of the segment's words, a space apart, or its whole text, unless you pass children. */
export function TranscriptText(props: TranscriptTextProps) {
  return (
    <parts.Text {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.words}>
            {(value, index) => (
              <>
                {index() > 0 && " "}
                <TranscriptWord value={value} />
              </>
            )}
          </For>
        ))}
    </parts.Text>
  );
}

export type TranscriptWordProps = ComponentProps<typeof parts.Word>;

/**
 * The word whose `value` is `"<segment id>/<index>"`, or a segment's whole text without words, with what the search
 * matched marked, unless you pass children.
 */
export function TranscriptWord(props: TranscriptWordProps) {
  return (
    <parts.Word {...omit(props, "children")}>
      {props.children ?? ((state) => <Marked segments={state.text} />)}
    </parts.Word>
  );
}
