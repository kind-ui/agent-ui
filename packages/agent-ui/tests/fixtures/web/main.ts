import { createAgent } from "@ui-sdk/web/agent";
import "./styles.css";

type CaseModule = { cases: Record<string, (root: HTMLElement) => void> };

const modules = import.meta.glob<CaseModule>("./cases/*.ts");
const params = new URLSearchParams(location.search);
const load = modules[`./cases/${params.get("c")}.ts`];
const render = load && (await load()).cases[params.get("case") ?? ""];
const root = document.getElementById("root");
if (!render || !root) throw new Error(`no fixture for ${location.search}`);

render(root);
Object.assign(window, { agent: createAgent() });
