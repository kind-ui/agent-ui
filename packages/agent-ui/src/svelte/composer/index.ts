import type { ComponentProps } from "svelte";
import Composer from "./Composer.svelte";
import ComposerAttach from "./ComposerAttach.svelte";
import ComposerAttachments from "./ComposerAttachments.svelte";
import ComposerInput from "./ComposerInput.svelte";
import ComposerRestored from "./ComposerRestored.svelte";
import ComposerSendMenu from "./ComposerSendMenu.svelte";
import ComposerSendMenuTrigger from "./ComposerSendMenuTrigger.svelte";
import ComposerSteer from "./ComposerSteer.svelte";
import ComposerTriggerMenu from "./ComposerTriggerMenu.svelte";
import { parts } from "./parts.js";

/** Empties a restored draft and removes it from `draftStorage`. */
export const ComposerDiscard = parts.Discard;
/** Sends the draft. Hidden while a turn runs or Stop shows. */
export const ComposerSubmit = parts.Submit;
/**
 * Shown in Send's place while a submission is pending or a turn is `running`, when the composer has `onStop`. Quiet
 * while Send shows beside it.
 */
export const ComposerStop = parts.Stop;

export {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerSendMenu,
  ComposerSendMenuTrigger,
  ComposerSteer,
  ComposerTriggerMenu,
};
export type ComposerProps = ComponentProps<typeof Composer>;
export type ComposerInputProps = ComponentProps<typeof ComposerInput>;
export type ComposerSteerProps = ComponentProps<typeof ComposerSteer>;
export type ComposerSendMenuTriggerProps = ComponentProps<typeof ComposerSendMenuTrigger>;
export type ComposerSendMenuProps = ComponentProps<typeof ComposerSendMenu>;
