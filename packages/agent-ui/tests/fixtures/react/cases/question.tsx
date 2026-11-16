import type { Answers } from "@kind-ui/agent-ui";
import type { QuestionOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Question } from "../../../../src/react/question.js";
import { deployQuestions, questionHost } from "../../shared/question.js";

const { host, submit, skip } = questionHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Questions({ motion }: { motion?: QuestionOptions["motion"] }) {
  const [submitted, setSubmitted] = useState<Answers>();
  useEffect(() => {
    Object.assign(window, { kindHost: host, kindQuestion: { record: setSubmitted } });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <p id="above">Above</p>
      <Question
        id="deploy"
        label="Deploy questions"
        questions={deployQuestions}
        submitted={submitted}
        onSubmit={submit}
        onSkip={skip}
        motion={motion}
      />
      <p id="below">Below</p>
    </div>
  );
}

function Controlled() {
  const [value, setValue] = useState<Answers>({ env: "staging" });
  const [refusing, setRefusing] = useState(true);
  useEffect(() => {
    Object.assign(window, { kindHost: host, kindRefuse: setRefusing });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <Question
        id="deploy"
        label="Deploy questions"
        questions={deployQuestions}
        value={value}
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
