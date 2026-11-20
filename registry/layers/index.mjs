// The render layers and the manifests of the ones built after React and Web (framework layers plan D9, D10).
import solid from "./solid.mjs";
import svelte from "./svelte.mjs";
import vue from "./vue.mjs";

/** Every render layer, in fixture server order: React, Web, React StrictMode, then one server per layer below. */
export const LAYERS = ["react", "web", "vue", "svelte", "solid"];

/** `components`, `internals` and `specs` of each manifest-driven layer. React and Web ship every component. */
export const manifests = { vue, svelte, solid };

/** The layers `KIND_LAYERS` (comma-separated) selects; every layer when it's unset or empty. */
export function selectedLayers(value = process.env.KIND_LAYERS) {
  const names = (value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const unknown = names.filter((name) => !LAYERS.includes(name));
  if (unknown.length)
    throw new Error(`KIND_LAYERS: unknown layer ${unknown.join(", ")}; use ${LAYERS.join(", ")}`);
  return names.length ? LAYERS.filter((name) => names.includes(name)) : [...LAYERS];
}
