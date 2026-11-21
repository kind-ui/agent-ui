import { taskPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(taskPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  list: "ol",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-files": "span",
});

export type TaskProps = ComponentProps<typeof parts.Root>;

/**
 * The steps an agent takes for one task, as it takes them, with how many are done. Any `children` replace the
 * default trigger and content.
 */
export function Task(props: TaskProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const TaskTrigger = parts.Trigger;
export const TaskIcon = parts.Icon;
export const TaskContent = parts.Content;
export const TaskItemIcon = parts.ItemIcon;

export type TaskTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Task", unless you pass children. */
export function TaskTitle(props: TaskTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export type TaskMetaProps = ComponentProps<typeof parts.Meta>;

/** How many items are complete, as "2 of 5", unless you pass children. */
export function TaskMeta(props: TaskMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state) => `${state.done} of ${state.total}`)}
    </parts.Meta>
  );
}

export type TaskListProps = ComponentProps<typeof parts.List>;

/** An item for each of the `items`, unless you pass children. */
export function TaskList(props: TaskListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.items} keyed={(item) => item.id}>
            {(item) => <TaskItem value={item().id} />}
          </For>
        ))}
    </parts.List>
  );
}

export type TaskItemProps = ComponentProps<typeof parts.Item>;

/** The item whose `id` is `value`. Without children, it shows the item's mark, title and files. */
export function TaskItem(props: TaskItemProps) {
  return <parts.Item {...omit(props, "children")}>{props.children ?? <DefaultItemParts />}</parts.Item>;
}

export type TaskItemTitleProps = ComponentProps<typeof parts.ItemTitle>;

/** The item's `title`, unless you pass children. */
export function TaskItemTitle(props: TaskItemTitleProps) {
  return (
    <parts.ItemTitle {...omit(props, "children")}>
      {props.children ?? ((state) => state.title)}
    </parts.ItemTitle>
  );
}

export type TaskItemFilesProps = ComponentProps<typeof parts.ItemFiles>;

/** The item's `files`, each as code, unless you pass children. Rendered only while the item has files. */
export function TaskItemFiles(props: TaskItemFilesProps) {
  return (
    <parts.ItemFiles {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.files} keyed={false}>
            {(file) => <code>{file()}</code>}
          </For>
        ))}
    </parts.ItemFiles>
  );
}

function DefaultItemParts() {
  return (
    <>
      <TaskItemIcon />
      <TaskItemTitle />
      <TaskItemFiles />
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <TaskTrigger>
        <TaskIcon />
        <TaskTitle />
        <TaskMeta />
      </TaskTrigger>
      <TaskContent>
        <TaskList />
      </TaskContent>
    </>
  );
}
