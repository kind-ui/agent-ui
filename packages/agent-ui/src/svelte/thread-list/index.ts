import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import ThreadList from "./ThreadList.svelte";
import ThreadListDialog from "./ThreadListDialog.svelte";
import ThreadListDialogCancel from "./ThreadListDialogCancel.svelte";
import ThreadListDialogDelete from "./ThreadListDialogDelete.svelte";
import ThreadListDialogError from "./ThreadListDialogError.svelte";
import ThreadListEnd from "./ThreadListEnd.svelte";
import ThreadListGrid from "./ThreadListGrid.svelte";
import ThreadListHeading from "./ThreadListHeading.svelte";
import ThreadListLink from "./ThreadListLink.svelte";
import ThreadListMenu from "./ThreadListMenu.svelte";
import ThreadListMenuContent from "./ThreadListMenuContent.svelte";
import ThreadListNew from "./ThreadListNew.svelte";
import ThreadListRetry from "./ThreadListRetry.svelte";
import ThreadListRow from "./ThreadListRow.svelte";

/** Scrolls the rows, of which it renders only those in view. Holds a `ThreadListGrid` and a `ThreadListEnd`. */
export const ThreadListViewport = parts.Viewport;

export {
  ThreadList,
  ThreadListDialog,
  ThreadListDialogCancel,
  ThreadListDialogDelete,
  ThreadListDialogError,
  ThreadListEnd,
  ThreadListGrid,
  ThreadListHeading,
  ThreadListLink,
  ThreadListMenu,
  ThreadListMenuContent,
  ThreadListNew,
  ThreadListRetry,
  ThreadListRow,
};
export type ThreadListProps = ComponentProps<typeof ThreadList>;
export type ThreadListNewProps = ComponentProps<typeof ThreadListNew>;
export type ThreadListGridProps = ComponentProps<typeof ThreadListGrid>;
export type ThreadListHeadingProps = ComponentProps<typeof ThreadListHeading>;
export type ThreadListRowProps = ComponentProps<typeof ThreadListRow>;
export type ThreadListLinkProps = ComponentProps<typeof ThreadListLink>;
export type ThreadListMenuProps = ComponentProps<typeof ThreadListMenu>;
export type ThreadListMenuContentProps = ComponentProps<typeof ThreadListMenuContent>;
export type ThreadListDialogProps = ComponentProps<typeof ThreadListDialog>;
export type ThreadListDialogErrorProps = ComponentProps<typeof ThreadListDialogError>;
export type ThreadListDialogCancelProps = ComponentProps<typeof ThreadListDialogCancel>;
export type ThreadListDialogDeleteProps = ComponentProps<typeof ThreadListDialogDelete>;
export type ThreadListEndProps = ComponentProps<typeof ThreadListEnd>;
export type ThreadListRetryProps = ComponentProps<typeof ThreadListRetry>;
