import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Tool from "./Tool.svelte";
import ToolApproval from "./ToolApproval.svelte";
import ToolError from "./ToolError.svelte";
import ToolInput from "./ToolInput.svelte";
import ToolMeta from "./ToolMeta.svelte";
import ToolOutput from "./ToolOutput.svelte";
import ToolRetry from "./ToolRetry.svelte";
import ToolRetryButton from "./ToolRetryButton.svelte";
import ToolTitle from "./ToolTitle.svelte";

export {
  Tool,
  ToolApproval,
  ToolError,
  ToolInput,
  ToolMeta,
  ToolOutput,
  ToolRetry,
  ToolRetryButton,
  ToolTitle,
};
export const ToolTrigger = parts.Trigger;
export const ToolIcon = parts.Icon;
export const ToolContent = parts.Content;
export const ToolInputCopy = parts.InputCopy;
export const ToolOutputCopy = parts.OutputCopy;

export type ToolProps = ComponentProps<typeof Tool>;
export type ToolTitleProps = ComponentProps<typeof ToolTitle>;
export type ToolApprovalProps = ComponentProps<typeof ToolApproval>;
export type ToolInputProps = ComponentProps<typeof ToolInput>;
export type ToolOutputProps = ComponentProps<typeof ToolOutput>;
export type ToolMetaProps = ComponentProps<typeof ToolMeta>;
export type ToolRetryProps = ComponentProps<typeof ToolRetry>;
export type ToolRetryButtonProps = ComponentProps<typeof ToolRetryButton>;
export type ToolErrorProps = ComponentProps<typeof ToolError>;
