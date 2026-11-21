import { type SidebarHandleState, sidebarPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit, Show } from "solid-js";
import { KindDrawer, KindDrawerBackdrop, KindDrawerContent } from "./internal/drawer.js";
import { KindResizable, KindResizableHandle, KindResizablePanel } from "./internal/resizable.js";

const parts = createParts(sidebarPrimitive, {
  root: "div",
  title: "aside",
  handle: "div",
  inset: "div",
  trigger: "button",
});

export type SidebarProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: JSX.Element };
export type SidebarPanelProps = ComponentProps<typeof parts.Title>;
export type SidebarHandleProps = Omit<ComponentProps<typeof parts.Handle>, "children" | "class"> & {
  /** Classes for the separator itself, UI SDK's Resizable handle. */
  class?: string;
};
export type SidebarInsetProps = ComponentProps<typeof parts.Inset>;
export type SidebarTriggerProps = ComponentProps<typeof parts.Trigger>;

type Render = (props: Record<string, unknown>, state: unknown) => JSX.Element;

/**
 * A panel beside the page that a person resizes and collapses, and that turns into a modal drawer on a narrow
 * screen. Write `SidebarPanel`, `SidebarHandle` and `SidebarInset` inside it in reading order, and a
 * `SidebarTrigger` anywhere inside. The Resizable stays mounted on a narrow screen, so the page in the inset never
 * mounts again; only the panel's content moves into the drawer.
 */
export function Sidebar(props: SidebarProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(state) => <KindResizable {...state.resizable}>{props.children}</KindResizable>}
    </parts.Root>
  );
}

/** The panel, an `aside` named by the sidebar's `label`: a Resizable panel beside the page, else a drawer. */
export function SidebarPanel(props: SidebarPanelProps) {
  const render = (
    panel: Record<string, unknown>,
    state: Parameters<NonNullable<SidebarPanelProps["render"]>>[1],
  ) => {
    const element = () => {
      const own = props.render as Render | undefined;
      return own ? own(panel, state) : <aside {...panel} />;
    };
    return (
      <KindResizablePanel {...state.resizablePanel}>
        <Show when={state.overlay} fallback={element()}>
          <KindDrawer {...state.drawer}>
            <KindDrawerBackdrop data-agent-hidden="" />
            <KindDrawerContent {...state.drawerContent}>{element()}</KindDrawerContent>
          </KindDrawer>
        </Show>
      </KindResizablePanel>
    );
  };
  return <parts.Title {...omit(props, "render")} render={render as SidebarPanelProps["render"]} />;
}

/** The resize handle between the panel and the inset, named "Resize <label>". Absent while the panel is a drawer. */
export function SidebarHandle(props: SidebarHandleProps) {
  return (
    <parts.Handle {...omit(props, "class")}>
      {(state: SidebarHandleState) => (
        <KindResizableHandle aria-label={state["aria-label"]} class={props.class} data-agent-hidden="" />
      )}
    </parts.Handle>
  );
}

/** The page beside the panel. */
export function SidebarInset(props: SidebarInsetProps) {
  const render = (
    inset: Record<string, unknown>,
    state: Parameters<NonNullable<SidebarInsetProps["render"]>>[1],
  ) => {
    const own = props.render as Render | undefined;
    const element = own ? own(inset, state) : <div {...inset} />;
    return <KindResizablePanel {...state.resizablePanel}>{element}</KindResizablePanel>;
  };
  return <parts.Inset {...omit(props, "render")} render={render as SidebarInsetProps["render"]} />;
}

/** Opens and closes the panel, named "Show <label>" or "Hide <label>". Without children it shows the panel icon. */
export function SidebarTrigger(props: SidebarTriggerProps) {
  return <parts.Trigger {...props} />;
}
