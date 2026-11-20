export type Layer = "react" | "web" | "vue" | "svelte" | "solid";
export type Manifest = { components: string[]; internals: string[]; specs: string[] };

export const LAYERS: Layer[];
export const manifests: Record<"vue" | "svelte" | "solid", Manifest>;
export function selectedLayers(value?: string): Layer[];
