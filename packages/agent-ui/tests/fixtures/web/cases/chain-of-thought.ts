import type { ChainOfThoughtOptions, ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
import { defineChainOfThought } from "../../../../src/web/chain-of-thought.js";

const initial: ChainOfThoughtStep[] = [
  { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
  { id: "search", status: "running", title: "Search flights" },
  { id: "compare", status: "pending", title: "Compare fares" },
];

const item = (step: ChainOfThoughtStep) => {
  const element = document.createElement("kind-chain-of-thought-item");
  element.setAttribute("value", step.id);
  const content = document.createElement("kind-chain-of-thought-item-content");
  const text = document.createElement("p");
  text.textContent = `Details for ${step.title}. Collapsed text: kumquat ${step.id}.`;
  content.append(text);
  element.append(content);
  return element;
};

const chains = (motion?: ChainOfThoughtOptions["motion"]) => (root: HTMLElement) => {
  defineChainOfThought();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const chain = document.createElement("kind-chain-of-thought");
  chain.id = "chain";
  chain.innerHTML = `<kind-chain-of-thought-trigger><button><kind-chain-of-thought-icon></kind-chain-of-thought-icon><kind-chain-of-thought-title></kind-chain-of-thought-title><kind-chain-of-thought-meta></kind-chain-of-thought-meta></button></kind-chain-of-thought-trigger><kind-chain-of-thought-content><kind-chain-of-thought-list></kind-chain-of-thought-list></kind-chain-of-thought-content>`;
  chain.querySelector("kind-chain-of-thought-list")?.append(...initial.map(item));
  Object.assign(chain, {
    label: "Researching flights",
    status: "running",
    durationSeconds: 12,
    steps: initial,
  });
  if (motion) chain.motion = motion;
  const plain = document.createElement("kind-chain-of-thought");
  plain.id = "plain";
  Object.assign(plain, { label: "Planning the trip", status: "complete", steps: initial.slice(0, 1) });
  page.append(chain, plain);
  root.append(page);
  const steps = () => chain.steps ?? [];
  Object.assign(window, {
    kindChain: {
      setStatus: (id: string, status: ChainOfThoughtStep["status"]) => {
        chain.steps = steps().map((step) => (step.id === id ? { ...step, status } : step));
      },
      append: (step: ChainOfThoughtStep) => {
        chain.querySelector("kind-chain-of-thought-list")?.append(item(step));
        chain.steps = [...steps(), step];
      },
      remove: (id: string) => {
        chain.querySelector(`kind-chain-of-thought-item[value="${id}"]`)?.remove();
        chain.steps = steps().filter((step) => step.id !== id);
      },
    },
  });
};

export const cases = { all: chains(), reduced: chains("reduced") };
