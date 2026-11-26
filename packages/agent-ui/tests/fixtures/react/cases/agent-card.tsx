import { AgentCard } from "../../../../src/react/agent-card.js";
import { agentCardHost, minimal, planner, reviewer } from "../../shared/agent-card.js";

const host = agentCardHost();
Object.assign(window, { kindHost: host });

export const cases = {
  all: () => (
    <div className="flex w-[28rem] flex-col gap-3 p-6">
      <section id="planner">
        <AgentCard
          agent={planner}
          status="running"
          href="https://example.com/agents/planner"
          onAction={host.record}
        />
      </section>
      <section id="reviewer">
        <AgentCard agent={reviewer} status="complete" level={2} actionLabel="Start" onAction={host.record} />
      </section>
      <section id="minimal">
        <AgentCard agent={minimal} href="data:text/html,Scout" />
      </section>
    </div>
  ),
};
