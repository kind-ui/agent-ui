import type { Answers } from "@kind-ui/agent-ui";
import type { QuestionOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineQuestion } from "../../../../src/web/question.js";
import { deployQuestions, questionHost } from "../../shared/question.js";

const { host, submit, skip } = questionHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const questions = (motion?: QuestionOptions["motion"]) => (root: HTMLElement) => {
  defineQuestion();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
  const below = Object.assign(document.createElement("p"), { id: "below", textContent: "Below" });
  const question = document.createElement("kind-question");
  question.id = "deploy";
  question.label = "Deploy questions";
  question.canSubmit = true;
  question.canSkip = true;
  question.questions = deployQuestions;
  if (motion) question.motion = motion;
  question.addEventListener("questionsubmit", (event) =>
    event.detail.waitUntil(submit(event.detail.value, event.detail) as Promise<void>),
  );
  question.addEventListener("skip", (event) =>
    event.detail.waitUntil(skip(event.detail.value, event.detail) as Promise<void>),
  );
  page.append(above, question, below);
  root.append(page);
  Object.assign(window, {
    kindHost: host,
    kindQuestion: {
      record: (answers: Answers | undefined) => {
        question.submitted = answers;
      },
    },
  });
};

export const cases = { all: questions(), reduced: questions("reduced") };
