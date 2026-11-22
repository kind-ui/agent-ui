import { render } from "svelte/server";
import { loadCase, noCase } from "./cases.js";

export async function renderCase(name: string, search: URLSearchParams) {
  const variant = search.get("case") ?? "";
  const fixture = await loadCase(name, variant);
  if (!fixture) return { head: "", html: noCase };
  const { head, body } = render(fixture.default, { props: { variant, params: search } });
  return { head, html: body };
}
