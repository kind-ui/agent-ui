import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/vue/scroll-area";
import { type Component, defineComponent, h, type VNode } from "vue";
import { withKindClass } from "./kind-class.js";

type ElementRef = (el: Element | null) => void;
type ViewportScope = { props: Record<string, unknown>; state: unknown; children: Component };

export const KindScrollArea = withKindClass(ScrollArea, "relative overflow-hidden", "KindScrollArea");
// The viewport hands UI SDK its bind a microtask late, so the root binds first. Vue binds children first, and
// `@ui-sdk/core`'s viewport bind measures and settles the scrollbars' visibility in a microtask, while the root's
// reads `:hover` in a later one without settling it again: over server markup, which is under the pointer as it
// hydrates, a hovered scroll area kept its scrollbars hidden until the pointer moved (AGENTS.md, Vue conformance).
export const KindScrollAreaViewport = defineComponent({
  name: "KindScrollAreaViewport",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    let bind: ElementRef | undefined;
    let bound: Element | null = null;
    const ref = (node: unknown) => {
      const el = node instanceof Element ? node : null;
      if (el === null) {
        if (bound) bind?.(null);
        bound = null;
      } else if (bound === el) bind?.(el);
      else
        queueMicrotask(() => {
          if (bound !== el && el.isConnected) {
            bound = el;
            bind?.(el);
          }
        });
    };
    return () =>
      h(
        ScrollAreaViewport,
        {
          ...attrs,
          class: [
            "size-full rounded-[inherit] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset-inset)]",
            attrs.class,
          ],
        },
        {
          ...slots,
          render: (scope: ViewportScope): VNode[] => {
            bind = scope.props.ref as ElementRef | undefined;
            const later = { ...scope, props: { ...scope.props, ref } };
            return slots.render
              ? (slots.render(later) as VNode[])
              : [h("div", later.props, slots.default?.({ state: scope.state }))];
          },
        },
      );
  },
}) as unknown as typeof ScrollAreaViewport;
export const KindScrollAreaContent = withKindClass(ScrollAreaContent, "min-w-full", "KindScrollAreaContent");
export const KindScrollAreaScrollbar = withKindClass(
  ScrollAreaScrollbar,
  "flex touch-none select-none p-0.5 opacity-0 data-visible:opacity-100 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2.5",
  "KindScrollAreaScrollbar",
);
export const KindScrollAreaThumb = withKindClass(
  ScrollAreaThumb,
  "flex-1 rounded-full bg-[color-mix(in_oklab,var(--kind-color-muted)_55%,transparent)]",
  "KindScrollAreaThumb",
);
export const KindScrollAreaScrollToEnd = withKindClass(
  ScrollAreaScrollToEnd,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-full)] bg-[var(--kind-color-raised)] px-3.5 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:cursor-not-allowed data-disabled:opacity-[var(--kind-disabled-opacity)] data-pending:cursor-wait opacity-0 data-visible:opacity-100 shadow-[0_0_0_1px_var(--kind-color-hairline)]",
  "KindScrollAreaScrollToEnd",
);
