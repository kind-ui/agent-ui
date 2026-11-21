import { type AnsiSpan, terminalPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

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

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

// A part that fills an empty default slot from its state.
const withDefault = <Part>(part: Part, name: string, fill: (state: never) => unknown) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part as never, attrs, {
          ...slots,
          default: slots.default ?? (({ state }: { state: never }) => fill(state)),
        });
    },
  }) as unknown as Part;

export const TerminalTrigger = parts.Trigger;
export const TerminalIcon = parts.Icon;
export const TerminalContent = parts.Content;
export const TerminalCopy = parts.Copy;
/** Scrolls the output and follows its end. Holds a `TerminalOutput`. */
export const TerminalViewport = parts.Viewport;

/** The command, or the `label`, unless you fill the default slot. */
export const TerminalTitle = withDefault(
  parts.Title,
  "TerminalTitle",
  (state: { title: string }) => state.title,
);

/** "exit N" once there's an exit code, unless you fill the default slot. */
export const TerminalExit = withDefault(parts.Exit, "TerminalExit", (state: { text: string }) => state.text);

/** The duration as "N s", unless you fill the default slot. */
export const TerminalMeta = withDefault(
  parts.Meta,
  "TerminalMeta",
  (state: { duration: string }) => state.duration,
);

/**
 * The command after its prompt, which the stylesheet draws, unless you fill the default slot. Present only while a
 * `label` replaces the command as the title.
 */
export const TerminalCommand = withDefault(
  parts.Command,
  "TerminalCommand",
  (state: { command: string }) => state.command,
);

const spanStyle = (span: AnsiSpan) =>
  span.fg || span.bg ? { color: span.fg, backgroundColor: span.bg } : undefined;

const spans = ({ state }: { state: { spans: readonly AnsiSpan[] } }) =>
  state.spans.map((span, index) =>
    h(
      "span",
      {
        key: index,
        style: spanStyle(span),
        "data-bold": span.bold ? "" : undefined,
        "data-dim": span.dim ? "" : undefined,
        "data-italic": span.italic ? "" : undefined,
        "data-underline": span.underline ? "" : undefined,
        "data-strike": span.strike ? "" : undefined,
      },
      span.text,
    ),
  );

/**
 * One line of output, its `index`th, as styled spans, unless you fill the default slot. A line renders again only
 * when its own spans change, since Vue renders a child again only when its props do.
 */
export const TerminalLine = defineComponent({
  name: "TerminalLine",
  inheritAttrs: false,
  props: { index: { type: Number, required: true }, value: String },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        parts.Line,
        { ...attrs, index: props.index, value: props.value ?? String(props.index) },
        { ...slots, default: slots.default ?? spans },
      );
  },
}) as unknown as typeof parts.Line;

/** A `TerminalLine` for each line in view, unless you fill the default slot. */
export const TerminalOutput = withDefault(
  parts.Output,
  "TerminalOutput",
  (state: { rows: readonly { index: number }[] }) =>
    state.rows.map((row) => h(TerminalLine, { key: row.index, index: row.index })),
);

/** Shown while the reader has scrolled away from the end. "Jump to latest", unless you fill the default slot. */
export const TerminalJump = withDefault(parts.Jump, "TerminalJump", () => "Jump to latest");

const defaultParts = () => [
  h(
    TerminalTrigger,
    null,
    stable(() => [h(TerminalIcon), h(TerminalTitle), h(TerminalExit), h(TerminalMeta)]),
  ),
  h(
    TerminalContent,
    null,
    stable(() =>
      h("div", { "data-terminal-screen": "", "data-kind-code": "" }, [
        h("div", { "data-terminal-header": "" }, [h(TerminalCommand), h(TerminalCopy)]),
        h(
          TerminalViewport,
          null,
          stable(() => h(TerminalOutput)),
        ),
        h(TerminalJump),
      ]),
    ),
  ),
];

/**
 * A command and its output as a step: the command, its exit code and duration, then the output with its ANSI colors,
 * following its end while it streams. A default slot replaces the default parts.
 */
export const Terminal = defineComponent({
  name: "Terminal",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
