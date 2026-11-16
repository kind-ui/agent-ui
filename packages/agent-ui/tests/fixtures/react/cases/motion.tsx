import { enter, exit, layout } from "@kind-ui/agent-ui/core";

Object.assign(window, { kindMotion: { enter, exit, layout } });

export const cases = {
  box: () => (
    <div id="box" className="h-16 w-16 bg-[rgb(1,2,3)]">
      <span data-dot>.</span>
      <span data-dot>.</span>
      <span data-dot>.</span>
    </div>
  ),
};
