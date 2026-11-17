import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { AddMenu } from "../../../../src/react/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";

const { host, action } = addMenuHost();

function Page({ motion, refusing, inert }: { motion?: MotionMode; refusing?: boolean; inert?: boolean }) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="p-6">
      <AddMenu
        id="add"
        items={addItems}
        onAction={
          inert
            ? undefined
            : (id, details) => {
                action(id, details);
                if (refusing) details.cancel();
              }
        }
        motion={motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  inert: () => <Page inert />,
};
