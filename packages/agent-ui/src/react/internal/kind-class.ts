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

// Adds Kind UI classes in front of the caller's `className` and passes every other prop through.
export function withKindClass<C extends (props: never) => ReactNode>(
  component: C,
  base: string,
  displayName: string,
): C {
  const Inner = component as unknown as FunctionComponent<{ className?: ClassName }>;
  const Kind: FunctionComponent<{ className?: ClassName }> = (props) =>
    createElement(Inner, { ...props, className: mergeClass(base, props.className) });
  Kind.displayName = displayName;
  return Kind as unknown as C;
}
