// The Solid registry consumer's entry: every component, as `shadcn add` copies it, one section each.
// `items/<name>.tsx` renders one component; it lands with the component's line in `registry/layers/solid.mjs`.
import { type JSX, render } from "@solidjs/web";
import { For } from "solid-js";

import "./index.css";

const items = import.meta.glob<{ default: () => JSX.Element }>("./items/*.tsx", { eager: true });

render(
  () => (
    <main class="flex max-w-xl flex-col gap-6 p-6">
      <For each={Object.entries(items)}>
        {([path, item]) => {
          const Item = item.default;
          return (
            <section data-item={path.slice("./items/".length, -".tsx".length)}>
              <Item />
            </section>
          );
        }}
      </For>
    </main>
  ),
  document.getElementById("root") as HTMLElement,
);
