// A part re-renders when its state changes identity, so state built from the same inputs is reused.
export function memo<Args extends unknown[], Value>(
  build: (...args: Args) => Value,
): (...args: Args) => Value {
  let last: { args: Args; value: Value } | undefined;
  return (...args) => {
    if (last?.args.every((arg, index) => Object.is(arg, args[index]))) return last.value;
    last = { args, value: build(...args) };
    return last.value;
  };
}

// Cached by object rather than with `memo`, so instances that render side by side don't evict each other's values.
export const cached = <Key extends object, Value>(
  cache: WeakMap<Key, Value>,
  key: Key,
  build: (key: Key) => Value,
): Value => {
  let value = cache.get(key);
  if (value === undefined) {
    value = build(key);
    cache.set(key, value);
  }
  return value;
};
