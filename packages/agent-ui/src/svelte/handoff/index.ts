import type { ComponentProps } from "svelte";
import Handoff from "./Handoff.svelte";
import HandoffApproval from "./HandoffApproval.svelte";
import HandoffFromAvatar from "./HandoffFromAvatar.svelte";
import HandoffReason from "./HandoffReason.svelte";
import HandoffStatus from "./HandoffStatus.svelte";
import HandoffText from "./HandoffText.svelte";
import HandoffToAvatar from "./HandoffToAvatar.svelte";
import { parts } from "./parts.js";

export const HandoffStatusIcon = parts.StatusIcon;

export {
  Handoff,
  HandoffApproval,
  HandoffFromAvatar,
  HandoffReason,
  HandoffStatus,
  HandoffText,
  HandoffToAvatar,
};
export type HandoffProps = ComponentProps<typeof Handoff>;
export type HandoffFromAvatarProps = ComponentProps<typeof HandoffFromAvatar>;
export type HandoffToAvatarProps = ComponentProps<typeof HandoffToAvatar>;
export type HandoffTextProps = ComponentProps<typeof HandoffText>;
export type HandoffReasonProps = ComponentProps<typeof HandoffReason>;
export type HandoffStatusProps = ComponentProps<typeof HandoffStatus>;
export type HandoffApprovalProps = ComponentProps<typeof HandoffApproval>;
