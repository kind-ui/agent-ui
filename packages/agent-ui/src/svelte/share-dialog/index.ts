import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import ShareDialog from "./ShareDialog.svelte";
import ShareDialogClose from "./ShareDialogClose.svelte";
import ShareDialogContent from "./ShareDialogContent.svelte";
import ShareDialogCopy from "./ShareDialogCopy.svelte";
import ShareDialogCreate from "./ShareDialogCreate.svelte";
import ShareDialogDescription from "./ShareDialogDescription.svelte";
import ShareDialogError from "./ShareDialogError.svelte";
import ShareDialogLink from "./ShareDialogLink.svelte";
import ShareDialogRevoke from "./ShareDialogRevoke.svelte";
import ShareDialogTitle from "./ShareDialogTitle.svelte";
import ShareDialogTrigger from "./ShareDialogTrigger.svelte";
import ShareDialogVisibility from "./ShareDialogVisibility.svelte";

export {
  ShareDialog,
  ShareDialogClose,
  ShareDialogContent,
  ShareDialogCopy,
  ShareDialogCreate,
  ShareDialogDescription,
  ShareDialogError,
  ShareDialogLink,
  ShareDialogRevoke,
  ShareDialogTitle,
  ShareDialogTrigger,
  ShareDialogVisibility,
};
/** Dims the page behind the dialog. */
export const ShareDialogBackdrop = parts.Backdrop;
export type ShareDialogProps = ComponentProps<typeof ShareDialog>;
export type ShareDialogTriggerProps = ComponentProps<typeof ShareDialogTrigger>;
export type ShareDialogContentProps = ComponentProps<typeof ShareDialogContent>;
export type ShareDialogTitleProps = ComponentProps<typeof ShareDialogTitle>;
export type ShareDialogDescriptionProps = ComponentProps<typeof ShareDialogDescription>;
export type ShareDialogVisibilityProps = ComponentProps<typeof ShareDialogVisibility>;
export type ShareDialogLinkProps = ComponentProps<typeof ShareDialogLink>;
export type ShareDialogCreateProps = ComponentProps<typeof ShareDialogCreate>;
export type ShareDialogCopyProps = ComponentProps<typeof ShareDialogCopy>;
export type ShareDialogRevokeProps = ComponentProps<typeof ShareDialogRevoke>;
export type ShareDialogErrorProps = ComponentProps<typeof ShareDialogError>;
export type ShareDialogCloseProps = ComponentProps<typeof ShareDialogClose>;
