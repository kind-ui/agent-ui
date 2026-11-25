import { h } from "vue";
import { AgentCard } from "../components/ui/vue/agent-card.js";

export default () =>
  h(AgentCard, { agent: { id: "planner", name: "Planner", model: "GPT-5" }, status: "running" });
