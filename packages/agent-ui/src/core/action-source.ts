import { type ActionDetails, type ChangeSource, dispatch } from "@ui-sdk/core";

/**
 * Who caused an action, like `"mouse"`, `"keyboard"` or `"agent"`. `dispatch` is UI SDK's public way to learn it, an
 * agent's act included, but it drops the callback's return value, which a pending lock needs, so it reports to a
 * callback of its own.
 */
export const actionSource = (event: Event | undefined, reason: string): ChangeSource => {
  let source: ChangeSource = "programmatic";
  const report = (_value: unknown, details: ActionDetails) => {
    source = details.source;
  };
  dispatch({ options: () => ({ onAction: report }) }, "onAction", undefined, {
    reason,
    ...(event && { event }),
  });
  return source;
};
