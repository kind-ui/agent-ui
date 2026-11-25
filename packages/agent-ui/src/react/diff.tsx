"use client";

import { type DiffPiece, diffPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, memo } from "react";

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
export function Diff({ children, ...props }: DiffProps) {
  return <parts.Root {...props}>{children !== undefined ? children : DEFAULT_PARTS}</parts.Root>;
}

/** Holds the path, status, stats and actions. */
export const DiffHeader = parts.Header;
export const DiffCopy = parts.Copy;
/** Scrolls the lines. Holds a `DiffTable`. */
export const DiffViewport = parts.Viewport;

export type DiffPathProps = ComponentProps<typeof parts.Path>;

/** The path, after the old one for a rename, unless you pass children. */
export function DiffPath({
  children = ({ path, oldPath }) =>
    oldPath && oldPath !== path ? (
      <>
        <span data-diff-old-path="">{oldPath}</span>
        {path}
      </>
    ) : (
      path
    ),
  ...props
}: DiffPathProps) {
  return <parts.Path {...props}>{children}</parts.Path>;
}

export type DiffStatusProps = ComponentProps<typeof parts.Status>;

/** "Added", "Deleted" or "Renamed", unless you pass children. Absent for a modified file. */
export function DiffStatus({ children = ({ text }) => text, ...props }: DiffStatusProps) {
  return <parts.Status {...props}>{children}</parts.Status>;
}

export type DiffStatsProps = ComponentProps<typeof parts.Stats>;

/** "+12 −3", read as "12 added, 3 removed", unless you pass children. */
export function DiffStats({ children = ({ text }) => text, ...props }: DiffStatsProps) {
  return <parts.Stats {...props}>{children}</parts.Stats>;
}

export type DiffAcceptProps = ComponentProps<typeof parts.Accept>;

/** Present while `onAccept` is set. "Accept", unless you pass children. */
export function DiffAccept({ children = "Accept", ...props }: DiffAcceptProps) {
  return <parts.Accept {...props}>{children}</parts.Accept>;
}

export type DiffRevertProps = ComponentProps<typeof parts.Revert>;

/** Present while `onRevert` is set. "Revert", unless you pass children. */
export function DiffRevert({ children = "Revert", ...props }: DiffRevertProps) {
  return <parts.Revert {...props}>{children}</parts.Revert>;
}

export type DiffTableProps = ComponentProps<typeof parts.Table>;

/** A `DiffRow` for each row in view, unless you pass children. */
export function DiffTable({
  children = ({ rows }) => rows.map((row) => <DiffRow key={row.index} index={row.index} />),
  ...props
}: DiffTableProps) {
  return <parts.Table {...props}>{children}</parts.Table>;
}

export type DiffOldNumberProps = ComponentProps<typeof parts.OldNumber>;

/** The line's number in the old file, unless you pass children. */
export function DiffOldNumber({ children = ({ text }) => text, ...props }: DiffOldNumberProps) {
  return <parts.OldNumber {...props}>{children}</parts.OldNumber>;
}

export type DiffNewNumberProps = ComponentProps<typeof parts.NewNumber>;

/** The line's number in the new file, unless you pass children. */
export function DiffNewNumber({ children = ({ text }) => text, ...props }: DiffNewNumberProps) {
  return <parts.NewNumber {...props}>{children}</parts.NewNumber>;
}

export type DiffSignProps = ComponentProps<typeof parts.Sign>;

/** "added" or "removed", which the stylesheet shows as `+` or `−`, unless you pass children. */
export function DiffSign({ children = ({ text }) => text, ...props }: DiffSignProps) {
  return <parts.Sign {...props}>{children}</parts.Sign>;
}

const pieceStyle = (piece: DiffPiece) => (piece.color ? { color: piece.color } : undefined);

const Piece = ({ piece }: { piece: DiffPiece }) => {
  const Tag = piece.changed ? "mark" : "span";
  return (
    <Tag
      style={pieceStyle(piece)}
      data-italic={piece.fontStyle === "italic" ? "" : undefined}
      data-bold={piece.fontStyle === "bold" ? "" : undefined}
    >
      {piece.text}
    </Tag>
  );
};

export type DiffCodeProps = ComponentProps<typeof parts.Code>;

/**
 * The line's code with its changed words marked, a hunk's header, or a collapsed run's `DiffCollapsed` and
 * `DiffCollapsedText`, unless you pass children.
 */
export function DiffCode({
  children = ({ kind, text, pieces }) =>
    kind === "collapsed" ? (
      <>
        <DiffCollapsed />
        <DiffCollapsedText />
      </>
    ) : kind === "hunk" ? (
      text
    ) : (
      pieces.map((piece, index) => <Piece key={index} piece={piece} />)
    ),
  ...props
}: DiffCodeProps) {
  return <parts.Code {...props}>{children}</parts.Code>;
}

export type DiffCollapsedProps = ComponentProps<typeof parts.Collapsed>;

/** "Show N lines", unless you pass children. */
export function DiffCollapsed({ children = ({ text }) => text, ...props }: DiffCollapsedProps) {
  return <parts.Collapsed {...props}>{children}</parts.Collapsed>;
}

export type DiffCollapsedTextProps = ComponentProps<typeof parts.CollapsedText>;

/** The collapsed lines, hidden until find in page matches one, unless you pass children. */
export function DiffCollapsedText({ children = ({ text }) => text, ...props }: DiffCollapsedTextProps) {
  return <parts.CollapsedText {...props}>{children}</parts.CollapsedText>;
}

export type DiffRowProps = ComponentProps<typeof parts.Row>;

/**
 * The `index`th row: its old and new numbers, its sign and its code, unless you pass children. Memoized, so a row
 * that didn't change isn't rendered again when the rows in view change.
 */
export const DiffRow = memo(function DiffRow({ value, children = ROW_CELLS, ...props }: DiffRowProps) {
  return (
    <parts.Row value={value ?? String(props.index)} {...props}>
      {children}
    </parts.Row>
  );
});

const ROW_CELLS = (
  <>
    <DiffOldNumber />
    <DiffNewNumber />
    <DiffSign />
    <DiffCode />
  </>
);

// Shared, so new rows don't render the default parts' wrappers again.
const DEFAULT_PARTS = (
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
);
