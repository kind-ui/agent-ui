import { type DiffPiece, diffPrimitive } from "@kind-ui/agent-ui/core";
import { type ComponentProps, Dynamic, type JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";

const parts = createParts(diffPrimitive, {
  root: "figure",
  header: "div",
  path: "span",
  status: "span",
  stats: "span",
  copy: "button",
  accept: "button",
  revert: "button",
  viewport: "div",
  table: "div",
  row: "div",
  "old-number": "span",
  "new-number": "span",
  sign: "span",
  code: "span",
  collapsed: "button",
  "collapsed-text": "span",
});

export type DiffProps = ComponentProps<typeof parts.Root>;

/**
 * One file's change as a unified diff: its path, what changed in words, Copy, Accept and Revert, then its lines with
 * old and new numbers, changed words marked and long unchanged runs folded away. Any `children` replace the default
 * parts.
 */
export function Diff(props: DiffProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <DiffHeader>
            <DiffPath />
            <DiffStatus />
            <DiffStats />
            <DiffCopy />
            <DiffRevert />
            <DiffAccept />
          </DiffHeader>
          <DiffViewport>
            <DiffTable />
          </DiffViewport>
        </>
      )}
    </parts.Root>
  );
}

/** Holds the path, status, stats and actions. */
export const DiffHeader = parts.Header;
export const DiffCopy = parts.Copy;
/** Scrolls the lines. Holds a `DiffTable`. */
export const DiffViewport = parts.Viewport;

export type DiffPathProps = ComponentProps<typeof parts.Path>;

/** The path, after the old one for a rename, unless you pass children. */
export function DiffPath(props: DiffPathProps) {
  return (
    <parts.Path {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <Show when={state.oldPath && state.oldPath !== state.path}>
              <span data-diff-old-path="">{state.oldPath}</span>
            </Show>
            {state.path}
          </>
        ))}
    </parts.Path>
  );
}

export type DiffStatusProps = ComponentProps<typeof parts.Status>;

/** "Added", "Deleted" or "Renamed", unless you pass children. Absent for a modified file. */
export function DiffStatus(props: DiffStatusProps) {
  return (
    <parts.Status {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Status>
  );
}

export type DiffStatsProps = ComponentProps<typeof parts.Stats>;

/** "+12 −3", read as "12 added, 3 removed", unless you pass children. */
export function DiffStats(props: DiffStatsProps) {
  return <parts.Stats {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Stats>;
}

export type DiffAcceptProps = ComponentProps<typeof parts.Accept>;

/** Present while `onAccept` is set. "Accept", unless you pass children. */
export function DiffAccept(props: DiffAcceptProps) {
  return <parts.Accept {...omit(props, "children")}>{props.children ?? "Accept"}</parts.Accept>;
}

export type DiffRevertProps = ComponentProps<typeof parts.Revert>;

/** Present while `onRevert` is set. "Revert", unless you pass children. */
export function DiffRevert(props: DiffRevertProps) {
  return <parts.Revert {...omit(props, "children")}>{props.children ?? "Revert"}</parts.Revert>;
}

export type DiffTableProps = ComponentProps<typeof parts.Table>;

/** A `DiffRow` for each row in view, keyed by its index, unless you pass children. */
export function DiffTable(props: DiffTableProps) {
  return (
    <parts.Table {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.rows} keyed={(row) => row.index}>
            {(row) => <DiffRow index={row().index} />}
          </For>
        ))}
    </parts.Table>
  );
}

export type DiffRowProps = ComponentProps<typeof parts.Row>;

/** The `index`th row: its old and new numbers, its sign and its code, unless you pass children. */
export function DiffRow(props: DiffRowProps) {
  return (
    <parts.Row value={props.value ?? String(props.index)} {...omit(props, "children", "value")}>
      {props.children ?? (
        <>
          <DiffOldNumber />
          <DiffNewNumber />
          <DiffSign />
          <DiffCode />
        </>
      )}
    </parts.Row>
  );
}

export type DiffOldNumberProps = ComponentProps<typeof parts.OldNumber>;

/** The line's number in the old file, unless you pass children. */
export function DiffOldNumber(props: DiffOldNumberProps) {
  return (
    <parts.OldNumber {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.OldNumber>
  );
}

export type DiffNewNumberProps = ComponentProps<typeof parts.NewNumber>;

/** The line's number in the new file, unless you pass children. */
export function DiffNewNumber(props: DiffNewNumberProps) {
  return (
    <parts.NewNumber {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.NewNumber>
  );
}

export type DiffSignProps = ComponentProps<typeof parts.Sign>;

/** "added" or "removed", which the stylesheet shows as `+` or `−`, unless you pass children. */
export function DiffSign(props: DiffSignProps) {
  return <parts.Sign {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Sign>;
}

const pieceStyle = (piece: DiffPiece): JSX.CSSProperties | undefined =>
  piece.color ? { color: piece.color } : undefined;

export type DiffCodeProps = ComponentProps<typeof parts.Code>;

/**
 * The line's code with its changed words marked, a hunk's header, or a collapsed run's `DiffCollapsed` and
 * `DiffCollapsedText`, unless you pass children.
 */
export function DiffCode(props: DiffCodeProps) {
  return (
    <parts.Code {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Switch
            fallback={
              <For each={state.pieces} keyed={false}>
                {(piece) => (
                  <Dynamic
                    component={piece().changed ? "mark" : "span"}
                    style={pieceStyle(piece())}
                    data-italic={piece().fontStyle === "italic" ? "" : undefined}
                    data-bold={piece().fontStyle === "bold" ? "" : undefined}
                  >
                    {piece().text}
                  </Dynamic>
                )}
              </For>
            }
          >
            <Match when={state.kind === "collapsed"}>
              <DiffCollapsed />
              <DiffCollapsedText />
            </Match>
            <Match when={state.kind === "hunk"}>{state.text}</Match>
          </Switch>
        ))}
    </parts.Code>
  );
}

export type DiffCollapsedProps = ComponentProps<typeof parts.Collapsed>;

/** "Show N lines", unless you pass children. */
export function DiffCollapsed(props: DiffCollapsedProps) {
  return (
    <parts.Collapsed {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.Collapsed>
  );
}

export type DiffCollapsedTextProps = ComponentProps<typeof parts.CollapsedText>;

/** The collapsed lines, hidden until find in page matches one, unless you pass children. */
export function DiffCollapsedText(props: DiffCollapsedTextProps) {
  return (
    <parts.CollapsedText {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.CollapsedText>
  );
}
