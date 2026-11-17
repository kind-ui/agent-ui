import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { AddMenu } from "../../../../src/react/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";

const { host, action, open } = addMenuHost();

function Page({
  motion,
  refusing,
  presentation,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  presentation?: "sheet";
}) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <AddMenu
          id="add"
          items={addItems}
          onAction={(id, details) => {
            action(id, details);
            if (refusing) details.cancel();
          }}
          onOpenChange={open}
          motion={motion}
          presentation={presentation}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  sheet: () => <Page presentation="sheet" />,
};
