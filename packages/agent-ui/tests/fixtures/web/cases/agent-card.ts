import type { KindAgentCardElement } from "../../../../src/web/agent-card.js";
import { defineAgentCard } from "../../../../src/web/agent-card.js";
import { agentCardHost, minimal, planner, reviewer } from "../../shared/agent-card.js";

const host = agentCardHost();
Object.assign(window, { kindHost: host });

export const cases = {
  all: (root: HTMLElement) => {
    defineAgentCard();
    root.innerHTML = `
      <div class="flex w-[28rem] flex-col gap-3 p-6">
        <section id="planner">
          <kind-agent-card status="running" href="https://example.com/agents/planner" can-run></kind-agent-card>
        </section>
        <section id="reviewer">
          <kind-agent-card status="complete" level="2" action-label="Start" can-run></kind-agent-card>
        </section>
        <section id="minimal">
          <kind-agent-card href="data:text/html,Scout"></kind-agent-card>
        </section>
      </div>`;
    const agents = { planner, reviewer, minimal };
    for (const [id, agent] of Object.entries(agents)) {
      const card = root.querySelector<KindAgentCardElement>(`#${id} > kind-agent-card`);
      if (!card) continue;
      card.agent = agent;
      card.addEventListener("agentaction", (event) => host.record(event.detail.value, event.detail));
    }
  },
};
