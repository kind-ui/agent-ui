import type { JSX } from "@solidjs/web";
import { type Component, createComponent, merge, untrack } from "solid-js";

type ClassValue = string | ((state: never) => string | undefined) | undefined;
type Render = (props: Record<string, unknown>, state: unknown) => JSX.Element;
type KindProps = { class?: ClassValue; render?: Render; "data-slot"?: unknown };

function mergeClass(base: string, value: ClassValue): ClassValue {
  if (typeof value === "function") {
    return (state: never) => {
      const extra = value(state);
      return extra ? `${base} ${extra}` : base;
    };
  }
  return value ? `${base} ${value}` : base;
}

// The `data-slot` of the part whose `render` is running. The first Kind part it creates with that part's props is
// the render target and renders its bare UI SDK part, so the element gets the outer base classes once instead of
// both lists, as React's `withKindClass` does for `render={<KindMenuTrigger />}`.
let rendering: unknown;
const bareRenders = new WeakMap<Render, Render>();

function bareRender(render: Render | undefined): Render | undefined {
  if (typeof render !== "function") return render;
  let bare = bareRenders.get(render);
  if (!bare) {
    bare = (props, state) => {
      rendering = untrack(() => props["data-slot"]);
      try {
        return render(props, state);
      } finally {
        rendering = undefined;
      }
    };
    bareRenders.set(render, bare);
  }
  return bare;
}

export function withKindClass<C extends (props: never) => JSX.Element>(component: C, base: string): C {
  // UI SDK parts are generic over their props; the wrapper keeps the caller's component type.
  const Inner = component as unknown as Component<KindProps>;
  const Kind: Component<KindProps> = (props) => {
    const target = rendering != null && untrack(() => props["data-slot"]) === rendering;
    if (target) rendering = undefined;
    return createComponent(
      Inner,
      merge(props, {
        get class() {
          return target ? props.class : mergeClass(base, props.class);
        },
        get render() {
          return bareRender(props.render);
        },
      }),
    );
  };
  return Kind as unknown as C;
}
