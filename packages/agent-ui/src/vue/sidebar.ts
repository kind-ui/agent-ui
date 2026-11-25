import {
  type SidebarHandleState,
  type SidebarInsetState,
  type SidebarPanelState,
  type SidebarRootState,
  sidebarPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type VNode } from "vue";
import { KindDrawer, KindDrawerBackdrop, KindDrawerContent } from "./internal/drawer.js";
import { KindResizable, KindResizableHandle, KindResizablePanel } from "./internal/resizable.js";

const parts = createParts(sidebarPrimitive, {
  root: "div",
  heading: "aside",
  handle: "div",
  inset: "div",
  trigger: "button",
});

type RenderScope<State> = { props: Record<string, unknown>; state: State; children: Component };

// The caller's own `#render` slot, else the part's element with its children.
const element = <State>(
  tag: string,
  scope: RenderScope<State>,
  render: ((scope: RenderScope<State>) => VNode[]) | undefined,
) => (render ? render(scope) : h(tag, scope.props, [h(scope.children)]));

/**
 * A panel beside the page that a person resizes and collapses, and that turns into a modal drawer on a narrow
 * screen. Write `SidebarPanel`, `SidebarHandle` and `SidebarInset` inside it in reading order, and a
 * `SidebarTrigger` anywhere inside. The Resizable stays mounted on a narrow screen, so the page in the inset never
 * mounts again; only the panel's content moves into the drawer.
 */
export const Sidebar = defineComponent({
  name: "Sidebar",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        render: slots.render,
        default: ({ state }: { state: SidebarRootState }) => h(KindResizable, state.resizable, slots.default),
      });
  },
}) as unknown as typeof parts.Root;

/** The panel, an `aside` named by the sidebar's `label`: a Resizable panel beside the page, else a drawer. */
export const SidebarPanel = defineComponent({
  name: "SidebarPanel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Heading, attrs, {
        ...slots,
        render: (scope: RenderScope<SidebarPanelState>) => {
          const { state } = scope;
          const panel = element("aside", scope, slots.render);
          return [
            h(KindResizablePanel, state.resizablePanel, () =>
              state.overlay
                ? h(KindDrawer, state.drawer, () => [
                    h(KindDrawerBackdrop, { "data-agent-hidden": "" }),
                    h(KindDrawerContent, state.drawerContent, () => panel),
                  ])
                : panel,
            ),
          ];
        },
      });
  },
}) as unknown as typeof parts.Heading;

/** The resize handle between the panel and the inset, named "Resize <label>". Absent while the panel is a drawer. */
export const SidebarHandle = defineComponent({
  name: "SidebarHandle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      // `class` styles the separator itself, UI SDK's Resizable handle.
      const { class: className, ...rest } = attrs;
      return h(parts.Handle, rest, {
        render: slots.render,
        default: ({ state }: { state: SidebarHandleState }) =>
          h(KindResizableHandle, {
            "aria-label": state["aria-label"],
            class: className,
            "data-agent-hidden": "",
          }),
      });
    };
  },
}) as unknown as typeof parts.Handle;

/** The page beside the panel. */
export const SidebarInset = defineComponent({
  name: "SidebarInset",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Inset, attrs, {
        ...slots,
        render: (scope: RenderScope<SidebarInsetState>) => [
          h(KindResizablePanel, scope.state.resizablePanel, () => element("div", scope, slots.render)),
        ],
      });
  },
}) as unknown as typeof parts.Inset;

/** Opens and closes the panel, named "Show <label>" or "Hide <label>". Without a slot it shows the panel icon. */
export const SidebarTrigger = parts.Trigger;
