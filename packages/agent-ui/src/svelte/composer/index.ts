import type { ComponentProps } from "svelte";
import Composer from "./Composer.svelte";
import ComposerAttach from "./ComposerAttach.svelte";
import ComposerAttachments from "./ComposerAttachments.svelte";
import ComposerInput from "./ComposerInput.svelte";
import ComposerRestored from "./ComposerRestored.svelte";
import ComposerSteer from "./ComposerSteer.svelte";
import ComposerSteerMenu from "./ComposerSteerMenu.svelte";
import ComposerSteerMenuTrigger from "./ComposerSteerMenuTrigger.svelte";
import ComposerTriggerMenu from "./ComposerTriggerMenu.svelte";
import { parts } from "./parts.js";

/** Empties a restored draft and removes it from `draftStorage`. */
export const ComposerDiscard = parts.Discard;
/** Sends the draft. Hidden while Stop shows. */
export const ComposerSubmit = parts.Submit;
/** Shown in Send's place while a submission is pending or `running`, when the composer has `onStop`. */
export const ComposerStop = parts.Stop;

export {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerSteer,
  ComposerSteerMenu,
  ComposerSteerMenuTrigger,
  ComposerTriggerMenu,
};
export type ComposerProps = ComponentProps<typeof Composer>;
export type ComposerInputProps = ComponentProps<typeof ComposerInput>;
export type ComposerSteerProps = ComponentProps<typeof ComposerSteer>;
export type ComposerSteerMenuProps = ComponentProps<typeof ComposerSteerMenu>;
export type ComposerSteerMenuTriggerProps = ComponentProps<typeof ComposerSteerMenuTrigger>;
