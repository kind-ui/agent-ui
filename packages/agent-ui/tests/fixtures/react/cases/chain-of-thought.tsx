import type { ChainOfThoughtOptions, ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtIcon,
  ChainOfThoughtItem,
  ChainOfThoughtItemContent,
  ChainOfThoughtItemTrigger,
  ChainOfThoughtList,
  ChainOfThoughtMeta,
  ChainOfThoughtTitle,
  ChainOfThoughtTrigger,
} from "../../../../src/react/chain-of-thought.js";

const initial: ChainOfThoughtStep[] = [
  { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
  { id: "search", status: "running", title: "Search flights" },
  { id: "compare", status: "pending", title: "Compare fares" },
];

function Chains({ motion }: { motion?: ChainOfThoughtOptions["motion"] }) {
  const [steps, setSteps] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindChain: {
        setStatus: (id: string, status: ChainOfThoughtStep["status"]) =>
          setSteps((all) => all.map((step) => (step.id === id ? { ...step, status } : step))),
        append: (step: ChainOfThoughtStep) => setSteps((all) => [...all, step]),
        remove: (id: string) => setSteps((all) => all.filter((step) => step.id !== id)),
      },
    });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <ChainOfThought
        id="chain"
        label="Researching flights"
        status="running"
        durationSeconds={12}
        steps={steps}
        motion={motion}
      >
        <ChainOfThoughtTrigger>
          <ChainOfThoughtIcon />
          <ChainOfThoughtTitle />
          <ChainOfThoughtMeta />
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtList>
            {steps.map((step) => (
              <ChainOfThoughtItem key={step.id} value={step.id}>
                <ChainOfThoughtItemTrigger />
                <ChainOfThoughtItemContent>
                  <p>
                    Details for {step.title}. Collapsed text: kumquat {step.id}.
                  </p>
                </ChainOfThoughtItemContent>
              </ChainOfThoughtItem>
            ))}
          </ChainOfThoughtList>
        </ChainOfThoughtContent>
      </ChainOfThought>
      <ChainOfThought id="plain" label="Planning the trip" status="complete" steps={initial.slice(0, 1)} />
    </div>
  );
}

export const cases = { all: () => <Chains />, reduced: () => <Chains motion="reduced" /> };
