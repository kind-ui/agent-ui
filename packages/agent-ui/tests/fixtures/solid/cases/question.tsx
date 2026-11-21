import type { Answers } from "@kind-ui/agent-ui";
import type { QuestionOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, onSettled } from "solid-js";
import { Question } from "../../../../src/solid/question.js";
import { expose } from "../../shared/expose.js";
import { deployQuestions, questionHost } from "../../shared/question.js";

const { host, submit, skip } = questionHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Questions(props: { motion?: QuestionOptions["motion"] }) {
  const [submitted, setSubmitted] = createSignal<Answers>();
  onSettled(() =>
    expose({ kindHost: host, kindQuestion: { record: (answers?: Answers) => setSubmitted(answers) } }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Question
        id="deploy"
        label="Deploy questions"
        questions={deployQuestions}
        submitted={submitted()}
        onSubmit={submit}
        onSkip={skip}
        motion={props.motion}
      />
      <p id="below">Below</p>
    </div>
  );
}

function Controlled() {
  const [value, setValue] = createSignal<Answers>({ env: "staging" });
  let refusing = true;
  onSettled(() =>
    expose({
      kindHost: host,
      kindRefuse: (next: boolean) => {
        refusing = next;
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <Question
        id="deploy"
        label="Deploy questions"
        questions={deployQuestions}
        value={value()}
        onValueChange={(next) => {
          if (!refusing) setValue(next);
        }}
        onSubmit={submit}
      />
    </div>
  );
}

export const cases = {
  all: () => <Questions />,
  reduced: () => <Questions motion="reduced" />,
  refused: () => <Controlled />,
};
