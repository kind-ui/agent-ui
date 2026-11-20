import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { loadCase, noCase } from "./cases.js";

export async function renderCase(name: string, search: URLSearchParams) {
  const variant = search.get("case") ?? "";
  const fixture = await loadCase(name, variant);
  if (!fixture) return { head: "", html: noCase };
  return { head: "", html: await renderToString(createSSRApp(fixture.default, { variant, params: search })) };
}
