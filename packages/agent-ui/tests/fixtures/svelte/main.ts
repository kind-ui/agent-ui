import { createAgent } from "@ui-sdk/svelte/agent";
import { hydrate, mount } from "svelte";
import { casePath, loadCase, noCase } from "./cases.js";
import "./styles.css";

const params = new URLSearchParams(location.search);
const name = params.get("c") ?? "";
const variant = params.get("case") ?? "";
const path = casePath(name);
if (path)
  document.head.append(Object.assign(document.createElement("script"), { type: "module", src: path }));
const fixture = await loadCase(name, variant);
const target = document.getElementById("root") as HTMLElement;

if (!fixture) target.innerHTML = noCase;
else
  (target.hasAttribute("data-ssr") ? hydrate : mount)(fixture.default, {
    target,
    props: { variant, params },
  });
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
