import { type ChangeDetails, createChange, css, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createCopy } from "../clipboard.js";

/** A run of highlighted code. Its `content` may hold line breaks. */
export type Token = { content: string; color?: string; fontStyle?: "italic" | "bold" };

/** Resolves the tokens of `code`, whose contents joined are `code`. No highlighter ships with Kind UI. */
export type Highlight = (code: string, lang: string | undefined) => Promise<Token[]>;

export type CodeBlockWrapChangeReason = "wrap-press" | "imperative";

export type CodeBlockOptions = {
  code?: string;
  /** Shown in the header and passed to `highlight`. */
  lang?: string;
  /**
   * Plain text shows until it resolves. A result whose code is no longer the start of `code` is discarded;
   * while code streams in, the highlighted start shows with the rest plain until the next result.
   */
  highlight?: Highlight;
  /** Controlled line wrapping. Don't pass with `defaultWrap`. */
  wrap?: boolean;
  /** Uncontrolled initial line wrapping. Defaults to `false`. */
  defaultWrap?: boolean;
  onWrapChange?: (wrap: boolean, details: ChangeDetails<CodeBlockWrapChangeReason>) => void;
  /** Numbers each line. Defaults to `false`. */
  lineNumbers?: boolean;
  /** Whether code is still streaming in, so the view follows its end. Defaults to `false`. */
  streaming?: boolean;
};

export type CodeBlockState = {
  code: string;
  lang: string | undefined;
  wrap: boolean;
  lineNumbers: boolean;
  streaming: boolean;
  /** The code split into lines of tokens: highlighted where a result covers it, plain after. */
  lines: Token[][];
  copied: boolean;
};

export type CodeBlockApi = {
  copy: () => Promise<boolean>;
  isWrapped: () => boolean;
  setWrap: (wrap: boolean, event?: Event) => boolean;
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
      language: CodeBlockSlot<{ lang: string | undefined }>;
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
  lang: options.lang,
  lineNumbers: options.lineNumbers ?? false,
  streaming: options.streaming ?? false,
});

export const codeBlockPrimitive: CodeBlockPrimitive = definePrimitive({
  name: "kind-code-block",
  options: {
    code: "string",
    lang: "string",
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

    // One request at a time; once it settles, the newest code is asked for.
    const request = () => {
      const { code = "", lang, highlight } = context.options();
      if (!highlight || pending || highlighted?.code === code) return;
      pending = true;
      const settle = (tokens?: Token[]) => {
        if (destroyed) return;
        pending = false;
        const current = context.options();
        const currentCode = current.code ?? "";
        if (
          tokens &&
          current.lang === lang &&
          current.highlight === highlight &&
          currentCode.startsWith(code)
        ) {
          highlighted = { code, tokens };
          store.set({ lines: toLines(currentCode, highlighted) });
        }
        request();
      };
      highlight(code, lang).then(settle, () => settle());
    };

    let previous = context.options();
    context.onOptions((options) => {
      const code = options.code ?? "";
      const reset = options.lang !== previous.lang || options.highlight !== previous.highlight;
      if (!reset && code === (previous.code ?? "")) return;
      previous = options;
      if (reset || !code.startsWith(highlighted?.code ?? "")) highlighted = undefined;
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
    language: slot<BaseSlotProps, { lang: string | undefined }>({
      state: (state) => ({ lang: state.lang }),
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
        style: css({ "--kind-code-block-gutter": `${String(state.lines.length).length}ch` }),
      }),
    }),
  }),
  agent: { actions: ["copy", "toggleWrap"] },
});
