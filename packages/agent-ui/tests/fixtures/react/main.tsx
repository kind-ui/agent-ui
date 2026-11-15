import { createAgent } from "@ui-sdk/react/agent";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type CaseModule = { cases: Record<string, () => ReactNode> };

const modules = import.meta.glob<CaseModule>("./cases/*.tsx");
const params = new URLSearchParams(location.search);
const load = modules[`./cases/${params.get("c")}.tsx`];
const render = load && (await load()).cases[params.get("case") ?? ""];
const root = document.getElementById("root");
if (!render || !root) throw new Error(`no fixture for ${location.search}`);

createRoot(root).render(render());
Object.assign(window, { agent: createAgent() });
