// The Svelte registry consumer's entry: every component, as `shadcn add` copies it, one section each.
// `items/<name>.svelte` renders one component; it lands with the component's line in `registry/layers/svelte.mjs`.
import { type Component, mount } from "svelte";

import "./index.css";

const items = import.meta.glob<{ default: Component }>("./items/*.svelte", { eager: true });

const main = document.createElement("main");
main.className = "flex max-w-xl flex-col gap-6 p-6";
for (const [path, item] of Object.entries(items)) {
  const section = document.createElement("section");
  section.dataset.item = path.slice("./items/".length, -".svelte".length);
  main.append(section);
  mount(item.default, { target: section });
}
document.getElementById("root")?.append(main);
