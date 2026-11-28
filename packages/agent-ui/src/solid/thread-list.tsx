import {
  type MenuPartState,
  type ThreadListDialogState,
  type ThreadListGridState,
  type ThreadListLinkState,
  type ThreadListMenuContentState,
  type ThreadListState,
  type ThreadListSummaryState,
  type ThreadListTimeState,
  threadListPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";
import {
  KindAlertDialog,
  KindAlertDialogBackdrop,
  KindAlertDialogContent,
  KindAlertDialogDescription,
  KindAlertDialogTitle,
} from "./internal/alert-dialog.js";
import { KindMenu, KindMenuContent, KindMenuItem, menuProps } from "./internal/menu.js";

const parts = createParts(threadListPrimitive, {
  root: "nav",
  new: "button",
  viewport: "div",
  grid: "div",
  heading: "div",
  "heading-cell": "div",
  row: "div",
  "link-cell": "div",
  link: "a",
  status: "span",
  unread: "span",
  summary: "span",
  time: "span",
  editor: "input",
  "more-cell": "div",
  more: "button",
  unarchive: "button",
  "fold-row": "div",
  "fold-cell": "div",
  fold: "button",
  empty: "p",
  menu: "div",
  "menu-content": "div",
  dialog: "div",
  "dialog-error": "span",
  "dialog-cancel": "button",
  "dialog-delete": "button",
  end: "div",
  retry: "button",
});

export type ThreadListProps = ComponentProps<typeof parts.Root>;

/**
 * The threads as a navigation grid, grouped by pinned, the host's groups and date, or by what each run needs from the
 * person with `groupBy="status"`, with New chat above and one menu of Rename, Pin, Share, Archive and Delete for every
 * row. Any `children` replace the default parts.
 */
export function ThreadList(props: ThreadListProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export type ThreadListNewProps = ComponentProps<typeof parts.New>;

/** Calls `onNew`. Reads "New chat" unless you pass children. Rendered only while `onNew` is set. */
export function ThreadListNew(props: ThreadListNewProps) {
  return (
    <parts.New {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-thread-list-icon="new" aria-hidden="true" />
          New chat
        </>
      )}
    </parts.New>
  );
}

export type ThreadListEmptyProps = ComponentProps<typeof parts.Empty>;

/** "Nothing is waiting on you." when grouped by status with nothing waiting or running, unless you pass children. */
export function ThreadListEmpty(props: ThreadListEmptyProps) {
  return (
    <parts.Empty {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Empty>
  );
}

/** Scrolls the rows, of which it renders only those in view. Holds a `ThreadListGrid` and a `ThreadListEnd`. */
export const ThreadListViewport = parts.Viewport;

export type ThreadListGridProps = ComponentProps<typeof parts.Grid>;

/** A `ThreadListHeading`, `ThreadListRow` or `ThreadListFold` for each row in view, unless you pass children. */
export function ThreadListGrid(props: ThreadListGridProps) {
  return (
    <parts.Grid {...omit(props, "children")}>
      {props.children ??
        ((state: ThreadListGridState) => (
          // Keyed by row key, so a row keeps its element as it scrolls or moves.
          <For each={state.visible} keyed={(item) => item.key}>
            {(item) => (
              <Switch fallback={<ThreadListRow value={item().key} />}>
                <Match when={state.rows[item().index]?.type === "heading"}>
                  <ThreadListHeading value={item().key} />
                </Match>
                <Match when={state.rows[item().index]?.type === "fold"}>
                  <ThreadListFold value={item().key} />
                </Match>
              </Switch>
            )}
          </For>
        ))}
    </parts.Grid>
  );
}

export type ThreadListHeadingProps = ComponentProps<typeof parts.Heading>;

/** A group's heading, by its row key, with its count when grouped by status. */
export function ThreadListHeading(props: ThreadListHeadingProps) {
  return (
    <parts.Heading {...props}>
      <parts.HeadingCell value={props.value}>
        {(state: { label: string; count: string }) => (
          <>
            {state.label}
            <Show when={state.count}>
              {" "}
              <span data-thread-list-count="">{state.count}</span>
            </Show>
          </>
        )}
      </parts.HeadingCell>
    </parts.Heading>
  );
}

export type ThreadListFoldProps = ComponentProps<typeof parts.FoldRow>;

/** The row after "Done"'s threads: "12 more done", which shows a page more, then "Show less". */
export function ThreadListFold(props: ThreadListFoldProps) {
  return (
    <parts.FoldRow {...props}>
      <parts.FoldCell value={props.value}>
        <parts.Fold value={props.value}>
          {(state: { label: string }) => (
            <>
              <span data-thread-list-icon="fold" aria-hidden="true" />
              {state.label}
            </>
          )}
        </parts.Fold>
      </parts.FoldCell>
    </parts.FoldRow>
  );
}

export type ThreadListRowProps = Omit<ComponentProps<typeof parts.Row>, "children"> & {
  /** What the link shows, a function of its `{ value, title }`. */
  children?: (state: ThreadListLinkState) => JSX.Element;
};

/**
 * A thread's row, by its id: its link, which also opens the row's menu on a right-click or Shift+F10, how long ago it
 * changed, and its More button, or Unarchive in the archived view, which takes the time's place on hover and focus.
 */
export function ThreadListRow(props: ThreadListRowProps) {
  return (
    <parts.Row {...omit(props, "children")}>
      <parts.LinkCell value={props.value}>
        <ThreadListLink value={props.value}>{props.children}</ThreadListLink>
        <parts.Editor value={props.value} type="text" />
        <parts.Time value={props.value}>{(state: ThreadListTimeState) => state.label}</parts.Time>
      </parts.LinkCell>
      <parts.MoreCell value={props.value}>
        <parts.More value={props.value} data-kind-icon-button="" data-kind-size="sm">
          <span data-thread-list-icon="more" aria-hidden="true" />
        </parts.More>
        <parts.Unarchive value={props.value}>{(state: { label: string }) => state.label}</parts.Unarchive>
      </parts.MoreCell>
    </parts.Row>
  );
}

export type ThreadListLinkProps = ComponentProps<typeof parts.Link>;

/** A thread's link: its title and its one mark, then its second line, unless you pass children. */
export function ThreadListLink(props: ThreadListLinkProps) {
  return (
    <parts.Link {...omit(props, "children")}>
      {props.children ??
        ((state: ThreadListLinkState) => (
          <>
            <span data-thread-list-title="">{state.title}</span>
            <parts.Status value={state.value} />
            <parts.Unread value={state.value} />
            <parts.Summary value={state.value}>
              {(summary: ThreadListSummaryState) => (
                <>
                  {summary.lead}
                  {summary.lead && summary.pieces.length > 0 ? " · " : ""}
                  <For each={summary.pieces} keyed={false}>
                    {(piece, index) => (index % 2 ? <code>{piece()}</code> : piece())}
                  </For>
                </>
              )}
            </parts.Summary>
          </>
        ))}
    </parts.Link>
  );
}

export type ThreadListMenuProps = { children?: JSX.Element };

/** UI SDK Menu, shared by every row, holding a `ThreadListMenuContent` unless you pass children. */
export function ThreadListMenu(props: ThreadListMenuProps) {
  return (
    <parts.Menu>
      {(menu: MenuPartState) => (
        <KindMenu {...menuProps(menu)}>{props.children ?? <ThreadListMenuContent />}</KindMenu>
      )}
    </parts.Menu>
  );
}

export type ThreadListMenuContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** The menu's items, a function of its thread and actions: a menu item for each action by default. */
  children?: (state: ThreadListMenuContentState) => JSX.Element;
};

/** UI SDK's `MenuContent` with Rename, Pin or Unpin, Share and Delete, each while its callback is set. */
export function ThreadListMenuContent(props: ThreadListMenuContentProps) {
  return (
    <parts.MenuContent>
      {(state: ThreadListMenuContentState) => (
        // Hidden from agents, which use the Thread List's own actions. Kept mounted, so Menu never shows up beside it.
        <KindMenuContent
          align="end"
          sideOffset={4}
          finalFocus={state.finalFocus}
          keepMounted
          data-agent-hidden=""
          {...omit(props, "children")}
        >
          {props.children?.(state) ?? (
            <For each={state.actions} keyed={(action) => action.value}>
              {(action) => (
                <KindMenuItem
                  value={action().value}
                  data-destructive={action().value === "delete" ? "" : undefined}
                >
                  <span data-thread-list-icon={action().value} aria-hidden="true" />
                  {action().label}
                </KindMenuItem>
              )}
            </For>
          )}
        </KindMenuContent>
      )}
    </parts.MenuContent>
  );
}

export type ThreadListDialogProps = { children?: JSX.Element };

/**
 * The Alert Dialog Delete opens: "Delete chat?", the thread's title, and Cancel and Delete, unless you pass children
 * for the answers. Rendered only while `onDelete` is set and `confirmDelete` is on.
 */
export function ThreadListDialog(props: ThreadListDialogProps) {
  return (
    <parts.Dialog>
      {(state: ThreadListDialogState) => (
        <KindAlertDialog controller={state.controller} dismissible={state.dismissible}>
          <KindAlertDialogBackdrop />
          <KindAlertDialogContent initialFocus={state.initialFocus} finalFocus={state.finalFocus}>
            <KindAlertDialogTitle>{state.title}</KindAlertDialogTitle>
            <KindAlertDialogDescription>{state.description}</KindAlertDialogDescription>
            {props.children ?? <DefaultAnswers />}
          </KindAlertDialogContent>
        </KindAlertDialog>
      )}
    </parts.Dialog>
  );
}

export type ThreadListDialogErrorProps = ComponentProps<typeof parts.DialogError>;

/** "Couldn't delete. Try again." after a delete fails, unless you pass children. */
export function ThreadListDialogError(props: ThreadListDialogErrorProps) {
  return (
    <parts.DialogError {...omit(props, "children")}>
      {props.children ?? "Couldn't delete. Try again."}
    </parts.DialogError>
  );
}

export type ThreadListDialogCancelProps = ComponentProps<typeof parts.DialogCancel>;

/** Closes the dialog. Reads "Cancel" unless you pass children. */
export function ThreadListDialogCancel(props: ThreadListDialogCancelProps) {
  return <parts.DialogCancel {...omit(props, "children")}>{props.children ?? "Cancel"}</parts.DialogCancel>;
}

export type ThreadListDialogDeleteProps = ComponentProps<typeof parts.DialogDelete>;

/** Calls `onDelete`. Reads "Delete" unless you pass children. */
export function ThreadListDialogDelete(props: ThreadListDialogDeleteProps) {
  return <parts.DialogDelete {...omit(props, "children")}>{props.children ?? "Delete"}</parts.DialogDelete>;
}

export type ThreadListEndProps = ComponentProps<typeof parts.End>;

/** After the rows while loading more: "Loading more chats", or "Couldn't load more chats" and Retry. */
export function ThreadListEnd(props: ThreadListEndProps) {
  return (
    <parts.End {...omit(props, "children")}>
      {props.children ??
        ((state: { status: ThreadListState["loadStatus"] }) => (
          <Show
            when={state.status === "loading"}
            fallback={
              <>
                Couldn't load more chats
                <ThreadListRetry />
              </>
            }
          >
            <span aria-hidden="true" data-status-mark="" data-status="running" />
            Loading more chats
          </Show>
        ))}
    </parts.End>
  );
}

export type ThreadListRetryProps = ComponentProps<typeof parts.Retry>;

/** Calls `onLoadMore` again. Reads "Retry" unless you pass children. */
export function ThreadListRetry(props: ThreadListRetryProps) {
  return <parts.Retry {...omit(props, "children")}>{props.children ?? "Retry"}</parts.Retry>;
}

function DefaultAnswers() {
  return (
    <div data-thread-list-answers="">
      <ThreadListDialogError />
      <ThreadListDialogCancel />
      <ThreadListDialogDelete />
    </div>
  );
}

function DefaultParts() {
  return (
    <>
      <ThreadListNew />
      <ThreadListEmpty />
      <ThreadListViewport>
        <ThreadListGrid />
        <ThreadListEnd />
      </ThreadListViewport>
      <ThreadListMenu />
      <ThreadListDialog />
    </>
  );
}
