import { Subagent } from "../components/ui/solid/subagent.js";

export default function SubagentItem() {
  return (
    <Subagent agentName="Code reviewer" status="complete" result="No issues found." defaultOpen>
      <p>Read two files.</p>
    </Subagent>
  );
}
