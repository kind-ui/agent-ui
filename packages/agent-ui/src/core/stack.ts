import { parse } from "stacktrace-parser";
import type { StackFrame } from "../types/index.js";

const UNKNOWN_FUNCTION = "<unknown>";

/**
 * Stack frames from a stack trace's text in V8, SpiderMonkey or JavaScriptCore's format, over `stacktrace-parser`.
 * The message lines before the first frame are left out; a later line it can't read stays as a frame with only
 * `raw`.
 */
export const parseStack = (text: string): StackFrame[] => {
  const frames: StackFrame[] = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    const [parsed] = parse(raw);
    if (!parsed) {
      if (frames.length > 0) frames.push({ raw });
      continue;
    }
    const frame: StackFrame = { raw };
    if (parsed.methodName !== UNKNOWN_FUNCTION) frame.fn = parsed.methodName;
    if (parsed.file) frame.file = parsed.file;
    if (parsed.lineNumber !== null) frame.line = parsed.lineNumber;
    if (parsed.column !== null) frame.column = parsed.column;
    frames.push(frame);
  }
  return frames;
};

/** Whether a frame is in a library: as the host says, else when its file is under `node_modules/` or Node's own. */
export const isLibraryFrame = (frame: StackFrame): boolean =>
  frame.library ??
  (frame.file !== undefined &&
    (frame.file.includes("node_modules/") ||
      frame.file.startsWith("node:") ||
      frame.file.startsWith("internal/")));
