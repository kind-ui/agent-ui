import { generateHydrationScript, renderToString } from "@solidjs/web";
import { loadCase, noCase } from "./cases.js";

export async function renderCase(name: string, search: URLSearchParams) {
  const fixture = await loadCase(name, search.get("case") ?? "");
  if (!fixture) return { head: "", html: noCase };
  return { head: generateHydrationScript(), html: renderToString(() => fixture.render(search)) };
}
