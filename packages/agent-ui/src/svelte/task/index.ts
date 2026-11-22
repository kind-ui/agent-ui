import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Task from "./Task.svelte";
import TaskItem from "./TaskItem.svelte";
import TaskItemFiles from "./TaskItemFiles.svelte";
import TaskItemTitle from "./TaskItemTitle.svelte";
import TaskList from "./TaskList.svelte";
import TaskMeta from "./TaskMeta.svelte";
import TaskTitle from "./TaskTitle.svelte";

export { Task, TaskItem, TaskItemFiles, TaskItemTitle, TaskList, TaskMeta, TaskTitle };
export const TaskTrigger = parts.Trigger;
export const TaskIcon = parts.Icon;
export const TaskContent = parts.Content;
export const TaskItemIcon = parts.ItemIcon;

export type TaskProps = ComponentProps<typeof Task>;
export type TaskTitleProps = ComponentProps<typeof TaskTitle>;
export type TaskMetaProps = ComponentProps<typeof TaskMeta>;
export type TaskListProps = ComponentProps<typeof TaskList>;
export type TaskItemProps = ComponentProps<typeof TaskItem>;
export type TaskItemTitleProps = ComponentProps<typeof TaskItemTitle>;
export type TaskItemFilesProps = ComponentProps<typeof TaskItemFiles>;
