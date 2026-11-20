import { createAgent } from "@ui-sdk/vue/agent";
import { createApp, createSSRApp } from "vue";
import { casePath, loadCase, noCase } from "./cases.js";
import "./styles.css";

const params = new URLSearchParams(location.search);
const name = params.get("c") ?? "";
const variant = params.get("case") ?? "";
const path = casePath(name);
if (path)
  document.head.append(Object.assign(document.createElement("script"), { type: "module", src: path }));
const fixture = await loadCase(name, variant);
const root = document.getElementById("root") as HTMLElement;

if (!fixture) root.innerHTML = noCase;
else
  (root.hasAttribute("data-ssr") ? createSSRApp : createApp)(fixture.default, { variant, params }).mount(
    root,
  );
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
