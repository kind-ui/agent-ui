import type { Part } from "./message.js";
import type { Step } from "./step.js";
import type { ToolCall } from "./tool.js";

export function isTextPart(part: Part): part is Extract<Part, { type: "text" }> {
  return part.type === "text";
}

export function isReasoningPart(part: Part): part is Extract<Part, { type: "reasoning" }> {
  return part.type === "reasoning";
}

export function isFilePart(part: Part): part is Extract<Part, { type: "file" }> {
  return part.type === "file";
}

export function isSourcePart(part: Part): part is Extract<Part, { type: "source" }> {
  return part.type === "source";
}

export function isStepPart(part: Part): part is Extract<Part, { type: "step" }> {
  return part.type === "step";
}

export function isDataPart(part: Part): part is Extract<Part, { type: "data" }> {
  return part.type === "data";
}

export function isToolStep(step: Step): step is Extract<Step, { kind: "tool" }> {
  return step.kind === "tool";
}

// Presence comes from the field, never from truthiness: 0, false, "", and null are valid output values.
export function hasOutput(call: ToolCall): call is ToolCall & { output: NonNullable<ToolCall["output"]> } {
  return call.output !== undefined;
}
