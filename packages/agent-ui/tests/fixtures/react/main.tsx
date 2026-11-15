import { type AgentAction, createAgent } from "@ui-sdk/react/agent";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type CaseModule = { cases: Record<string, () => ReactNode>; allow?: (step: AgentAction) => boolean };

const modules = import.meta.glob<CaseModule>("./cases/*.tsx");
const params = new URLSearchParams(location.search);
const load = modules[`./cases/${params.get("c")}.tsx`];
const fixture = load && (await load());
const render = fixture?.cases[params.get("case") ?? ""];
const root = document.getElementById("root");
if (!render || !root) throw new Error(`no fixture for ${location.search}`);

// The `strict` mode serves the same cases under StrictMode, for the wave-1-react-strict project.
createRoot(root).render(import.meta.env.MODE === "strict" ? <StrictMode>{render()}</StrictMode> : render());
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
