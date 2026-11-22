import { type AnsiSpan, terminalPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(terminalPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  exit: "span",
  meta: "span",
  content: "div",
  command: "div",
  copy: "button",
  viewport: "div",
  output: "div",
  line: "div",
  jump: "button",
});

export type TerminalProps = ComponentProps<typeof parts.Root>;

/**
 * A command and its output as a step: the command, its exit code and duration, then the output with its ANSI colors,
 * following its end while it streams. Any `children` replace the default parts.
 */
export function Terminal(props: TerminalProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <TerminalTrigger>
            <TerminalIcon />
            <TerminalTitle />
            <TerminalExit />
            <TerminalMeta />
          </TerminalTrigger>
          <TerminalContent>
            <div data-terminal-screen="" data-kind-code="">
              <div data-terminal-header="">
                <TerminalCommand />
                <TerminalCopy />
              </div>
              <TerminalViewport>
                <TerminalOutput />
              </TerminalViewport>
              <TerminalJump />
            </div>
          </TerminalContent>
        </>
      )}
    </parts.Root>
  );
}

export const TerminalTrigger = parts.Trigger;
export const TerminalIcon = parts.Icon;
export const TerminalContent = parts.Content;
export const TerminalCopy = parts.Copy;
/** Scrolls the output and follows its end. Holds a `TerminalOutput`. */
export const TerminalViewport = parts.Viewport;

export type TerminalTitleProps = ComponentProps<typeof parts.Title>;

/** The command, or the `label`, unless you pass children. */
export function TerminalTitle(props: TerminalTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export type TerminalExitProps = ComponentProps<typeof parts.Exit>;

/** "exit N" once there's an exit code, unless you pass children. */
export function TerminalExit(props: TerminalExitProps) {
  return <parts.Exit {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Exit>;
}

export type TerminalMetaProps = ComponentProps<typeof parts.Meta>;

/** The duration as "N s", unless you pass children. */
export function TerminalMeta(props: TerminalMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>{props.children ?? ((state) => state.duration)}</parts.Meta>
  );
}

export type TerminalCommandProps = ComponentProps<typeof parts.Command>;

/**
 * The command after its prompt, which the stylesheet draws, unless you pass children. Present only while a `label`
 * replaces the command as the title.
 */
export function TerminalCommand(props: TerminalCommandProps) {
  return (
    <parts.Command {...omit(props, "children")}>{props.children ?? ((state) => state.command)}</parts.Command>
  );
}

export type TerminalOutputProps = ComponentProps<typeof parts.Output>;

/** A `TerminalLine` for each line in view, keyed by its index, unless you pass children. */
export function TerminalOutput(props: TerminalOutputProps) {
  return (
    <parts.Output {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.rows} keyed={(row) => row.index}>
            {(row) => <TerminalLine index={row().index} />}
          </For>
        ))}
    </parts.Output>
  );
}

const spanStyle = (span: AnsiSpan): JSX.CSSProperties | undefined =>
  span.fg || span.bg ? { color: span.fg, "background-color": span.bg } : undefined;

export type TerminalLineProps = ComponentProps<typeof parts.Line>;

/** One line of output, its `index`th, as styled spans, unless you pass children. */
export function TerminalLine(props: TerminalLineProps) {
  return (
    <parts.Line value={props.value ?? String(props.index)} {...omit(props, "children", "value")}>
      {props.children ??
        ((state) => (
          <For each={state.spans} keyed={false}>
            {(span) => (
              <span
                style={spanStyle(span())}
                data-bold={span().bold ? "" : undefined}
                data-dim={span().dim ? "" : undefined}
                data-italic={span().italic ? "" : undefined}
                data-underline={span().underline ? "" : undefined}
                data-strike={span().strike ? "" : undefined}
              >
                {span().text}
              </span>
            )}
          </For>
        ))}
    </parts.Line>
  );
}

export type TerminalJumpProps = ComponentProps<typeof parts.Jump>;

/** Shown while the reader has scrolled away from the end. "Jump to latest", unless you pass children. */
export function TerminalJump(props: TerminalJumpProps) {
  return <parts.Jump {...omit(props, "children")}>{props.children ?? "Jump to latest"}</parts.Jump>;
}
