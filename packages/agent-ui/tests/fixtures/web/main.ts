import { type AgentAction, createAgent } from "@ui-sdk/web/agent";
import "./styles.css";

type CaseModule = {
  cases: Record<string, (root: HTMLElement) => void>;
  allow?: (step: AgentAction) => boolean;
};

const modules = import.meta.glob<CaseModule>("./cases/*.ts");
const params = new URLSearchParams(location.search);
const load = modules[`./cases/${params.get("c")}.ts`];
const fixture = load && (await load());
const render = fixture?.cases[params.get("case") ?? ""];
const root = document.getElementById("root");
if (!render || !root) throw new Error(`no fixture for ${location.search}`);

render(root);
Object.assign(window, { agent: createAgent({ allow: fixture?.allow }) });
