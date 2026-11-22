import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onSettled } from "solid-js";
import { AddMenu } from "../../../../src/solid/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";
import { expose } from "../../shared/expose.js";

const { host, action } = addMenuHost();

function Page(props: { motion?: MotionMode; refusing?: boolean; inert?: boolean }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="p-6">
      <AddMenu
        id="add"
        items={addItems}
        onAction={
          props.inert
            ? undefined
            : (id, details) => {
                action(id, details);
                if (props.refusing) details.cancel();
              }
        }
        motion={props.motion}
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
