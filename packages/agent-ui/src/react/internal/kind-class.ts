import { createElement, type FunctionComponent, isValidElement, type ReactNode } from "react";

type ClassName = string | ((state: never) => string | undefined) | undefined;
type KindProps = { className?: ClassName; render?: unknown };

const bareParts = new WeakMap<object, FunctionComponent<KindProps>>();

function mergeClass(base: string, className: ClassName): ClassName {
  if (typeof className === "function") {
    return (state: never) => {
      const extra = className(state);
      return extra ? `${base} ${extra}` : base;
    };
  }
  return className ? `${base} ${className}` : base;
}

// A Kind part rendered as another (`<KindToolbarButton render={<KindMenuTrigger />}>`) renders the
// target's bare UI SDK part, so the element gets the outer base classes once instead of both lists.
function bareRender(render: unknown): unknown {
  if (!isValidElement(render)) return render;
  const bare = bareParts.get(render.type as object);
  return bare ? createElement(bare, { ...(render.props as KindProps), key: render.key }) : render;
}

export function withKindClass<C extends (props: never) => ReactNode>(
  component: C,
  base: string,
  displayName: string,
): C {
  // UI SDK parts are generic over their props; the wrapper keeps the caller's component type.
  const Inner = component as unknown as FunctionComponent<KindProps>;
  const Kind: FunctionComponent<KindProps> = (props) =>
    createElement(Inner, {
      ...props,
      className: mergeClass(base, props.className),
      render: bareRender(props.render),
    });
  Kind.displayName = displayName;
  bareParts.set(Kind, Inner);
  return Kind as unknown as C;
}
