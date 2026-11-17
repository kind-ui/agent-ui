import { parse } from "stacktrace-parser";
import type { StackFrame } from "../types/index.js";

const UNKNOWN_FUNCTION = "<unknown>";
// V8's `at …` or the `fn@file` of SpiderMonkey and JavaScriptCore. Checked until the first frame, so a message that
// ends in a URL with a line number isn't read as one.
const FRAME = /^\s*at\s|@/;

/**
 * Stack frames from a stack trace's text in V8, SpiderMonkey or JavaScriptCore's format, over `stacktrace-parser`.
 * The message lines before the first frame are left out; a later line it can't read stays as a frame with only
 * `raw`.
 */
export const parseStack = (text: string): StackFrame[] => {
  const frames: StackFrame[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const [parsed] = frames.length > 0 || FRAME.test(raw) ? parse(raw) : [];
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
    (/node_modules[\\/]/.test(frame.file) ||
      frame.file.startsWith("node:") ||
      frame.file.startsWith("internal/")));
