// The Vue registry consumer's entry: every component, as `shadcn add` copies it, one section each.
// `items/<name>.ts` renders one component; it lands with the component's line in `registry/layers/vue.mjs`.
import { type Component, createApp, h } from "vue";

import "./index.css";

const items = import.meta.glob<{ default: Component }>("./items/*.ts", { eager: true });

createApp({
  render: () =>
    h(
      "main",
      { class: "flex max-w-xl flex-col gap-6 p-6" },
      Object.entries(items).map(([path, item]) =>
        h("section", { key: path, "data-item": path.slice("./items/".length, -".ts".length) }, [
          h(item.default),
        ]),
      ),
    ),
}).mount("#root");
