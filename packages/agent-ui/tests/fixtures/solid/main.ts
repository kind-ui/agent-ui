import { hydrate, render } from "@solidjs/web";
import { createAgent } from "@ui-sdk/solid/agent";
import { casePath, loadCase, noCase } from "./cases.js";
import "./styles.css";

const params = new URLSearchParams(location.search);
const name = params.get("c") ?? "";
const path = casePath(name);
if (path)
  document.head.append(Object.assign(document.createElement("script"), { type: "module", src: path }));
const fixture = await loadCase(name, params.get("case") ?? "");
const root = document.getElementById("root") as HTMLElement;

if (!fixture) root.innerHTML = noCase;
else (root.hasAttribute("data-ssr") ? hydrate : render)(() => fixture.render(params), root);
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
