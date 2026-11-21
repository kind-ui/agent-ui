import type { ChainOfThoughtOptions, ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
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
} from "../../../../src/solid/chain-of-thought.js";
import { expose } from "../../shared/expose.js";

const initial: ChainOfThoughtStep[] = [
  { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
  { id: "search", status: "running", title: "Search flights" },
  { id: "compare", status: "pending", title: "Compare fares" },
];

const openStepsChanges: [string[], string][] = [];

function Chains(props: { motion?: ChainOfThoughtOptions["motion"] }) {
  const [steps, setSteps] = createSignal(initial);
  onSettled(() =>
    expose({
      kindOpenStepsChanges: openStepsChanges,
      kindChain: {
        setStatus: (id: string, status: ChainOfThoughtStep["status"]) =>
          setSteps((all) => all.map((step) => (step.id === id ? { ...step, status } : step))),
        setStatuses: (statuses: Record<string, ChainOfThoughtStep["status"]>) =>
          setSteps((all) => all.map((step) => ({ ...step, status: statuses[step.id] ?? step.status }))),
        append: (step: ChainOfThoughtStep) => setSteps((all) => [...all, step]),
        remove: (id: string) => setSteps((all) => all.filter((step) => step.id !== id)),
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <ChainOfThought
        id="chain"
        label="Researching flights"
        status="running"
        durationSeconds={12}
        steps={steps()}
        motion={props.motion}
        onOpenStepsChange={(openSteps, details) => openStepsChanges.push([openSteps, details.reason])}
      >
        <ChainOfThoughtTrigger>
          <ChainOfThoughtIcon />
          <ChainOfThoughtTitle />
          <ChainOfThoughtMeta />
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtList>
            <For each={steps()} keyed={(step) => step.id}>
              {(step) => (
                <ChainOfThoughtItem value={step().id}>
                  <ChainOfThoughtItemTrigger />
                  <ChainOfThoughtItemContent>
                    <p>
                      Details for {step().title}. Collapsed text: kumquat {step().id}.
                    </p>
                  </ChainOfThoughtItemContent>
                </ChainOfThoughtItem>
              )}
            </For>
          </ChainOfThoughtList>
        </ChainOfThoughtContent>
      </ChainOfThought>
      <ChainOfThought id="plain" label="Planning the trip" status="complete" steps={initial.slice(0, 1)} />
    </div>
  );
}

export const cases = { all: () => <Chains />, reduced: () => <Chains motion="reduced" /> };
