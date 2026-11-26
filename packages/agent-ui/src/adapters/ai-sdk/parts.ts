// biome-ignore lint/suspicious/noTsIgnore: `ai` resolves when installed, so `@ts-expect-error` would fail.
/** @ts-ignore `ai` is an optional peer; without it these types are `any`. Kept in the emitted `.d.ts`. */
import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import type { Part, Step, StepStatus, ToolCall } from "../../types/index.js";
import { fromSdkApproval } from "./approval.js";

export type UIPart = UIMessage["parts"][number];

/** What a `toolTitles` function reads to word a call. */
export interface ToolTitleInput {
  /** The call's input so far; partial while it streams. */
  input: unknown;
  status: StepStatus;
}

/**
 * Titles in words by tool name, set once for every call: a string, or a function of the call's status and input
 * that returns "Reading `sign-in.ts`" while it runs and "Read `sign-in.ts`" once it's done. Code is in backticks.
 * A function that returns `""` leaves the call to Tool's own title.
 */
export type ToolTitles = Record<string, string | ((call: ToolTitleInput) => string)>;

export interface PartContext {
  messageId: string;
  index: number;
  /** Becomes each call's `title` and its step's `title`. */
  toolTitles?: ToolTitles | undefined;
}

type ToolPart = ToolUIPart | DynamicToolUIPart;

function isToolPart(part: UIPart): part is ToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

const toolStatus: Record<ToolPart["state"], StepStatus> = {
  "input-streaming": "running",
  "input-available": "running",
  "approval-requested": "awaiting-input",
  "approval-responded": "running",
  "output-available": "complete",
  "output-error": "error",
  "output-denied": "cancelled",
};

function fromToolPart(part: ToolPart, toolTitles?: ToolTitles): Extract<Part, { type: "step" }> {
  const dynamic = part.type === "dynamic-tool";
  // A `dynamic-tool` part with `dynamic: false` is a static tool the SDK normalized; it keeps its static origin.
  const name = dynamic ? part.toolName : part.type.slice("tool-".length);
  const call: ToolCall = {
    toolCallId: part.toolCallId,
    name,
    dynamic: dynamic && part.dynamic !== false,
    input: { state: part.state === "input-streaming" ? "streaming" : "ready", value: part.input },
  };
  if (part.state === "output-available") {
    call.output = { state: part.preliminary ? "preliminary" : "available", value: part.output };
  }
  if (part.state === "output-error") {
    call.outcome = "error";
    // Older static parts carried error input in the deprecated `rawInput`.
    if (part.input === undefined && "rawInput" in part) call.input.value = part.rawInput;
  }
  if (part.state === "output-denied") call.outcome = "denied";
  if (part.approval) call.approval = fromSdkApproval(part.approval);

  const status = toolStatus[part.state];
  const entry = toolTitles && Object.hasOwn(toolTitles, name) ? toolTitles[name] : undefined;
  const title = typeof entry === "function" ? entry({ input: call.input.value, status }) : entry;
  if (title) call.title = title;
  const step: Step = { id: part.toolCallId, kind: "tool", status, title: title || name, call };
  if (part.state === "output-error") step.error = { message: part.errorText };
  return { type: "step", id: part.toolCallId, step };
}

/** Maps one AI SDK UI message part. Returns `null` only for `step-start`; unknown types become `data`. */
export function fromUIMessagePart(part: UIPart, ctx: PartContext): Part | null {
  const id = `${ctx.messageId}:${ctx.index}`;
  const type: unknown = (part as { type?: unknown } | null)?.type;
  if (typeof type !== "string") return { type: "data", id, name: "unknown", data: part };

  if (part.type === "step-start") return null;
  if (part.type === "text" || part.type === "reasoning") {
    return { type: part.type, id, text: part.text, state: part.state ?? "done" };
  }
  if (part.type === "file") {
    return {
      type: "file",
      id,
      name: part.filename ?? part.mediaType,
      mediaType: part.mediaType,
      url: part.url,
    };
  }
  if (part.type === "source-url") {
    const source = { id: part.sourceId, title: part.title ?? part.url, url: part.url };
    return { type: "source", id, source };
  }
  if (part.type === "source-document") {
    const source = { id: part.sourceId, title: part.title, mediaType: part.mediaType };
    return { type: "source", id, source };
  }
  // A tool state this adapter does not know is passed through as data rather than guessed.
  if (isToolPart(part) && Object.hasOwn(toolStatus, part.state)) return fromToolPart(part, ctx.toolTitles);
  if (type.startsWith("data-") && "data" in part) {
    return { type: "data", id, name: type.slice("data-".length), data: part.data };
  }
  return { type: "data", id, name: type, data: part };
}
