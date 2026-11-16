import {
  type Color,
  createAnsiSequenceParser,
  createColorPalette,
  type ParseToken,
} from "ansi-sequence-parser";

/** A run of terminal text in one style. Colors are CSS values. */
export type AnsiSpan = {
  readonly text: string;
  readonly fg?: string;
  readonly bg?: string;
  readonly bold?: true;
  readonly dim?: true;
  readonly italic?: true;
  readonly underline?: true;
  readonly strike?: true;
};

/** One line of terminal output, without its line break. */
export type AnsiLine = { readonly spans: readonly AnsiSpan[] };

export type AnsiLines = {
  /**
   * The lines of the output so far. While the output only grows, every line but the last keeps its object, and an
   * update that changes nothing shown returns the same array.
   */
  update(output: string): readonly AnsiLine[];
  /** The output without escapes, as the lines show it, for copying. */
  text(): string;
};

const palette = createColorPalette({
  black: "var(--kind-ansi-black)",
  red: "var(--kind-ansi-red)",
  green: "var(--kind-ansi-green)",
  yellow: "var(--kind-ansi-yellow)",
  blue: "var(--kind-ansi-blue)",
  magenta: "var(--kind-ansi-magenta)",
  cyan: "var(--kind-ansi-cyan)",
  white: "var(--kind-ansi-white)",
  brightBlack: "var(--kind-ansi-bright-black)",
  brightRed: "var(--kind-ansi-bright-red)",
  brightGreen: "var(--kind-ansi-bright-green)",
  brightYellow: "var(--kind-ansi-bright-yellow)",
  brightBlue: "var(--kind-ansi-bright-blue)",
  brightMagenta: "var(--kind-ansi-bright-magenta)",
  brightCyan: "var(--kind-ansi-bright-cyan)",
  brightWhite: "var(--kind-ansi-bright-white)",
});

// Every escape the parser shouldn't see: control sequences, OSC strings (titles, links), other escapes and C0
// controls. The parser reads any `ESC [` up to the next `m` as SGR, so only SGR may reach it.
const ESCAPE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes is the point.
  /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[ -/]*[0-~])?|[\x00-\x08\x0b\x0c\x0e-\x1a\x1c-\x1f\x7f]/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes is the point.
const SGR = /^\x1b\[[\d;]*m$/;
// An escape cut off by the end of a chunk.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escapes is the point.
const UNFINISHED = /\x1b(?:\[[0-?]*[ -/]*|\][^\x07\x1b]*\x1b?|[ -/]*)$/;
// The parser skips an empty parameter, which terminals read as 0 (`ESC[m`, `ESC[;32m`).
const EMPTY_PARAMETER = /(?<=[[;])(?=[;m])/g;
const BREAK = /(\r\n|\r|\n)/;

const color = (value: Color | null) => (value ? palette.value(value) : undefined);

const toSpan = (token: ParseToken, text: string): AnsiSpan => {
  const span: { -readonly [Key in keyof AnsiSpan]: AnsiSpan[Key] } = { text };
  const { decorations } = token;
  let fg = color(token.foreground);
  let bg = color(token.background);
  if (decorations.has("reverse")) {
    [fg, bg] = [bg ?? "var(--kind-color-surface)", fg ?? "var(--kind-color-fg)"];
  }
  if (fg) span.fg = fg;
  if (bg) span.bg = bg;
  if (decorations.has("bold")) span.bold = true;
  if (decorations.has("dim")) span.dim = true;
  if (decorations.has("italic")) span.italic = true;
  if (decorations.has("underline")) span.underline = true;
  if (decorations.has("strikethrough")) span.strike = true;
  return span;
};

const sameStyle = (a: AnsiSpan, b: AnsiSpan) =>
  a.fg === b.fg &&
  a.bg === b.bg &&
  a.bold === b.bold &&
  a.dim === b.dim &&
  a.italic === b.italic &&
  a.underline === b.underline &&
  a.strike === b.strike;

/**
 * Terminal output as lines of styled spans, over `ansi-sequence-parser`. Only SGR styles are kept; every other
 * escape is dropped. A lone `\r` starts its line again, so a progress bar shows its last state. When the output
 * grows, only the new text is parsed.
 */
export const createAnsiLines = (): AnsiLines => {
  let parser = createAnsiSequenceParser();
  let output = "";
  let unfinished = "";
  let lines: AnsiLine[] = [];
  let current: AnsiSpan[] = [];
  // A `\r` moves back to the line's start: the line is replaced only once text follows, so `\r` then `\n`, or a
  // chunk ending after `\r`, keeps it.
  let returned = false;

  const add = (span: AnsiSpan) => {
    const last = current.at(-1);
    if (last && sameStyle(last, span)) {
      current[current.length - 1] = { ...last, text: last.text + span.text };
    } else {
      current.push(span);
    }
  };

  const append = (text: string) => {
    const tail = UNFINISHED.exec(text);
    unfinished = tail ? tail[0] : "";
    const sgrOnly = text
      .slice(0, tail?.index)
      .replace(ESCAPE, (sequence) => (SGR.test(sequence) ? sequence.replace(EMPTY_PARAMETER, "0") : ""));
    for (const token of parser.parse(sgrOnly)) {
      for (const piece of token.value.split(BREAK)) {
        if (piece === "\r") {
          returned = true;
        } else if (piece === "\n" || piece === "\r\n") {
          lines.push({ spans: current });
          current = [];
          returned = false;
        } else if (piece) {
          if (returned) {
            current = [];
            returned = false;
          }
          add(toSpan(token, piece));
        }
      }
    }
  };

  let result: readonly AnsiLine[] = [{ spans: [] }];
  return {
    update(next) {
      if (next === output) return result;
      if (next.startsWith(output)) {
        append(unfinished + next.slice(output.length));
      } else {
        parser = createAnsiSequenceParser();
        unfinished = "";
        lines = [];
        current = [];
        returned = false;
        append(next);
      }
      output = next;
      const last = result.at(-1)?.spans ?? [];
      const unchanged =
        lines.length === result.length - 1 &&
        current.length === last.length &&
        current.every((span, index) => span === last[index]);
      if (!unchanged) result = [...lines, { spans: [...current] }];
      return result;
    },
    text: () => result.map((line) => line.spans.map((span) => span.text).join("")).join("\n"),
  };
};
