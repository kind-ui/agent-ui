import { createElement, type FunctionComponent, type ReactNode } from "react";

type ClassName = string | ((state: never) => string | undefined) | undefined;

function mergeClass(base: string, className: ClassName): ClassName {
  if (typeof className === "function") {
    return (state: never) => {
      const extra = className(state);
      return extra ? `${base} ${extra}` : base;
    };
  }
  return className ? `${base} ${className}` : base;
}

export function withKindClass<C extends (props: never) => ReactNode>(
  component: C,
  base: string,
  displayName: string,
): C {
  // UI SDK parts are generic over their props; the wrapper keeps the caller's component type.
  const Inner = component as unknown as FunctionComponent<{ className?: ClassName }>;
  const Kind: FunctionComponent<{ className?: ClassName }> = (props) =>
    createElement(Inner, { ...props, className: mergeClass(base, props.className) });
  Kind.displayName = displayName;
  return Kind as unknown as C;
}
