import { type ChangeDetails, createChange, css, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createCopy } from "../clipboard.js";

/**
 * A run of highlighted code. Its `content` may hold line breaks. `color` is any CSS color: a
 * `light-dark()` pair follows `color-scheme` like the theme tokens do.
 */
export type Token = { content: string; color?: string; fontStyle?: "italic" | "bold" };

/** Resolves the tokens of `code`, whose contents joined are `code`. No highlighter ships with Kind UI. */
export type Highlight = (code: string, language: string | undefined) => Promise<Token[]>;

export type CodeBlockWrapChangeReason = "wrap-press" | "imperative";

export type CodeBlockOptions = {
  /**
   * The code to show.
   * @default ""
   */
  code?: string;
  /** The code's language, like `"ts"`, shown in the header and passed to `highlight`. */
  language?: string;
  /**
   * Resolves colored tokens for the code; plain text shows until it does. While code streams in, the highlighted
   * start shows with the rest plain. A new function each render is fine, and a rejection isn't retried until `code`
   * or `language` changes.
   */
  highlight?: Highlight;
  /** Whether long lines wrap, when you control it with `onWrapChange`. */
  wrap?: boolean;
  /**
   * Whether long lines wrap at first, when you don't control it.
   * @default false
   */
  defaultWrap?: boolean;
  /** Called before wrapping turns on or off; cancel `details` to keep it as it is. */
  onWrapChange?: (wrap: boolean, details: ChangeDetails<CodeBlockWrapChangeReason>) => void;
  /**
   * Numbers each line.
   * @default false
   */
  lineNumbers?: boolean;
  /**
   * Whether the code is still arriving, so the view follows its end.
   * @default false
   */
  streaming?: boolean;
};

export type CodeBlockState = {
  code: string;
  language: string | undefined;
  wrap: boolean;
  lineNumbers: boolean;
  streaming: boolean;
  /** The code split into lines of tokens: highlighted where a result covers it, plain after. */
  lines: Token[][];
  copied: boolean;
};

export type CodeBlockApi = {
  /** Copies the code, and resolves with whether the clipboard write went through. */
  copy: () => Promise<boolean>;
  isWrapped: () => boolean;
  /** Returns whether the change was accepted. */
  setWrap: (wrap: boolean, event?: Event) => boolean;
  /** Turns line wrapping on or off, and returns whether the change was accepted. */
  toggleWrap: (event?: Event) => boolean;
};

type CodeBlockSlot<Public extends object = Record<never, never>> = SlotDefinition<
  CodeBlockState,
  CodeBlockApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type CodeBlockPrimitive = ReturnType<
  typeof definePrimitive<
    CodeBlockOptions,
    CodeBlockState,
    CodeBlockApi,
    {
      root: CodeBlockSlot;
      header: CodeBlockSlot;
      language: CodeBlockSlot<{ language: string | undefined }>;
      wrap: CodeBlockSlot;
      copy: CodeBlockSlot;
      code: CodeBlockSlot<{ lines: Token[][] }>;
    }
  >
>;

type Highlighted = { code: string; tokens: Token[] };

function toLines(code: string, highlighted: Highlighted | undefined): Token[][] {
  const tokens = highlighted
    ? [...highlighted.tokens, { content: code.slice(highlighted.code.length) }]
    : [{ content: code }];
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    token.content.split("\n").forEach((content, index) => {
      if (index > 0) lines.push([]);
      if (content) lines[lines.length - 1]?.push({ ...token, content });
    });
  }
  if (lines.length > 1 && lines[lines.length - 1]?.length === 0) lines.pop();
  return lines;
}

const presentation = (options: CodeBlockOptions) => ({
  code: options.code ?? "",
  language: options.language,
  lineNumbers: options.lineNumbers ?? false,
  streaming: options.streaming ?? false,
});

export const codeBlockPrimitive: CodeBlockPrimitive = definePrimitive({
  name: "kind-code-block",
  options: {
    code: "string",
    language: "string",
    highlight: "value",
    wrap: "boolean",
    defaultWrap: "boolean",
    onWrapChange: "callback",
    lineNumbers: "boolean",
    streaming: "boolean",
  },
  state: (options: CodeBlockOptions): CodeBlockState => ({
    ...presentation(options),
    wrap: options.wrap ?? options.defaultWrap ?? false,
    lines: toLines(options.code ?? "", undefined),
    copied: false,
  }),
  sync: (options: CodeBlockOptions) => ({
    ...presentation(options),
    ...(options.wrap === undefined ? {} : { wrap: options.wrap }),
  }),
  controlled: ["wrap"],
  api: (context): CodeBlockApi => {
    const { store } = context;
    const change = createChange(context);
    const copy = createCopy(context);
    let highlighted: Highlighted | undefined;
    let pending = false;
    let destroyed = false;
    context.onDestroy(() => {
      destroyed = true;
    });

    // One request at a time; once it settles, the newest code is asked for. A code and language that
    // failed aren't asked for again.
    let failed: string | undefined;
    const request = () => {
      const { code = "", language, highlight } = context.options();
      if (!highlight || pending || highlighted?.code === code || failed === code) return;
      pending = true;
      const settle = (tokens?: Token[]) => {
        if (destroyed) return;
        pending = false;
        const current = context.options();
        const currentCode = current.code ?? "";
        if (!tokens) failed = code;
        else if (current.language === language && currentCode.startsWith(code)) {
          highlighted = { code, tokens };
          store.set({ lines: toLines(currentCode, highlighted) });
        }
        request();
      };
      highlight(code, language).then(settle, () => settle());
    };

    let previous = context.options();
    context.onOptions((options) => {
      const code = options.code ?? "";
      const languageChanged = options.language !== previous.language;
      const codeChanged = code !== (previous.code ?? "");
      const highlightAdded = !previous.highlight && options.highlight !== undefined;
      previous = options;
      if (highlightAdded) request();
      if (!languageChanged && !codeChanged) return;
      if (languageChanged || !code.startsWith(highlighted?.code ?? "")) highlighted = undefined;
      if (languageChanged) failed = undefined;
      store.set({ lines: toLines(code, highlighted) });
      request();
    });
    request();

    const setWrap = (wrap: boolean, event?: Event) =>
      change("wrap", wrap, event ? { reason: "wrap-press", event } : { reason: "imperative" });

    return {
      copy: () => copy(store.get().code),
      isWrapped: () => store.get().wrap,
      setWrap,
      toggleWrap: (event?: Event) => setWrap(!store.get().wrap, event),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({
        "data-wrap": state.wrap ? "" : undefined,
        "data-streaming": state.streaming ? "" : undefined,
      }),
    }),
    header: slot({}),
    language: slot<BaseSlotProps, { language: string | undefined }>({
      state: (state) => ({ language: state.language }),
    }),
    wrap: slot({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.toggleWrap(event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Wrap lines",
        "aria-pressed": String(state.wrap),
      }),
    }),
    copy: slot({
      role: "button",
      focus: "native",
      press: ({ api }) => void api.copy(),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Copy code",
        "data-copied": state.copied ? "" : undefined,
      }),
    }),
    code: slot<BaseSlotProps, { lines: Token[][] }>({
      state: (state) => ({ lines: state.lines }),
      attrs: (state) => ({
        "data-wrap": state.wrap ? "" : undefined,
        "data-line-numbers": state.lineNumbers ? "" : undefined,
        style: css({ "--kind-code-block-digits": String(String(state.lines.length).length) }),
      }),
    }),
  }),
  agent: { actions: ["copy", "toggleWrap"] },
});
