import { AgentCard } from "../components/ui/solid/agent-card.js";

export default function AgentCardItem() {
  return <AgentCard agent={{ id: "planner", name: "Planner", model: "GPT-5" }} status="running" />;
}
