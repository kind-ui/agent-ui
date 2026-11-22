import { Question } from "../components/ui/solid/question.js";

export default function QuestionItem() {
  return (
    <Question
      label="Deploy questions"
      questions={[
        {
          id: "env",
          prompt: "Where should it deploy?",
          kind: "single",
          required: true,
          options: [
            { value: "staging", label: "Staging" },
            { value: "prod", label: "Production" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  );
}
