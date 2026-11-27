import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Terminal from "./Terminal.svelte";
import TerminalApproval from "./TerminalApproval.svelte";
import TerminalCommand from "./TerminalCommand.svelte";
import TerminalExit from "./TerminalExit.svelte";
import TerminalJump from "./TerminalJump.svelte";
import TerminalLine from "./TerminalLine.svelte";
import TerminalMeta from "./TerminalMeta.svelte";
import TerminalOutput from "./TerminalOutput.svelte";
import TerminalTitle from "./TerminalTitle.svelte";

export const TerminalTrigger = parts.Trigger;
export const TerminalIcon = parts.Icon;
export const TerminalContent = parts.Content;
export const TerminalCopy = parts.Copy;
/** Scrolls the output and follows its end. Holds a `TerminalOutput`. */
export const TerminalViewport = parts.Viewport;

export {
  Terminal,
  TerminalApproval,
  TerminalCommand,
  TerminalExit,
  TerminalJump,
  TerminalLine,
  TerminalMeta,
  TerminalOutput,
  TerminalTitle,
};
export type TerminalProps = ComponentProps<typeof Terminal>;
export type TerminalTitleProps = ComponentProps<typeof TerminalTitle>;
export type TerminalExitProps = ComponentProps<typeof TerminalExit>;
export type TerminalMetaProps = ComponentProps<typeof TerminalMeta>;
export type TerminalApprovalProps = ComponentProps<typeof TerminalApproval>;
export type TerminalCommandProps = ComponentProps<typeof TerminalCommand>;
export type TerminalOutputProps = ComponentProps<typeof TerminalOutput>;
export type TerminalLineProps = ComponentProps<typeof TerminalLine>;
export type TerminalJumpProps = ComponentProps<typeof TerminalJump>;
