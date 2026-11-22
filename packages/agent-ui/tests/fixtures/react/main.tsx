import { type AgentAction, createAgent } from "@ui-sdk/react/agent";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type CaseModule = {
  cases: Record<string, (params: URLSearchParams) => ReactNode>;
  allow?: (step: AgentAction) => boolean;
};

const modules = import.meta.glob<CaseModule>("./cases/*.tsx");
const params = new URLSearchParams(location.search);
const path = `./cases/${params.get("c")}.tsx`;
const load = modules[path];
if (load)
  document.head.append(Object.assign(document.createElement("script"), { type: "module", src: path }));
const fixture = load && (await load());
const render = fixture?.cases[params.get("case") ?? ""];
const root = document.getElementById("root");
if (!render || !root) throw new Error(`no fixture for ${location.search}`);

createRoot(root).render(
  import.meta.env.MODE === "strict" ? <StrictMode>{render(params)}</StrictMode> : render(params),
);
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
