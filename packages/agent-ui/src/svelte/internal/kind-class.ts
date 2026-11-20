import type { Component } from "svelte";
import type { ClassValue } from "svelte/elements";

// Class values a Kind part already merged. A part hands its props to its `render` snippet, so a Kind part rendered
// there (`{#snippet render({ props })}<KindMenuTrigger {...props} />{/snippet}`) keeps them rather than adding its
// own base classes: the element gets the outer part's base classes once, as React's `withKindClass` does.
const merged = new WeakSet<object>();

function kindClass(base: string, value: unknown): ClassValue {
  if (typeof value === "object" && value !== null && merged.has(value)) return value as ClassValue;
  const result = value ? [base, value as ClassValue] : [base];
  merged.add(result);
  return result;
}

/**
 * A UI SDK part with Kind's base classes before the caller's `class`. Every other prop, bindings and snippets
 * included, passes through as the caller wrote it.
 */
export function withKindClass<C extends Component<never>>(component: C, base: string): C {
  const inner = component as unknown as (internals: unknown, props: object) => unknown;
  const Kind = (internals: unknown, props: Record<PropertyKey, unknown>) =>
    inner(
      internals,
      new Proxy(props, {
        get: (target, key) => (key === "class" ? kindClass(base, target.class) : Reflect.get(target, key)),
        has: (target, key) => key === "class" || Reflect.has(target, key),
        ownKeys: (target) => {
          const keys = Reflect.ownKeys(target);
          return keys.includes("class") ? keys : [...keys, "class"];
        },
        getOwnPropertyDescriptor: (target, key) =>
          key === "class"
            ? { enumerable: true, configurable: true, value: kindClass(base, target.class) }
            : Reflect.getOwnPropertyDescriptor(target, key),
      }),
    );
  return Kind as unknown as C;
}
