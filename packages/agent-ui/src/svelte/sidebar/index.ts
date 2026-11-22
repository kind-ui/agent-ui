import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Sidebar from "./Sidebar.svelte";
import SidebarHandle from "./SidebarHandle.svelte";
import SidebarInset from "./SidebarInset.svelte";
import SidebarPanel from "./SidebarPanel.svelte";

export { Sidebar, SidebarHandle, SidebarInset, SidebarPanel };
/** Opens and closes the panel, named "Show <label>" or "Hide <label>". Without children it shows the panel icon. */
export const SidebarTrigger = parts.Trigger;
export type SidebarProps = ComponentProps<typeof Sidebar>;
export type SidebarPanelProps = ComponentProps<typeof SidebarPanel>;
export type SidebarHandleProps = ComponentProps<typeof SidebarHandle>;
export type SidebarInsetProps = ComponentProps<typeof SidebarInset>;
export type SidebarTriggerProps = ComponentProps<typeof parts.Trigger>;
