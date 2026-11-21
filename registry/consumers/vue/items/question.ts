import { h } from "vue";
import { Question } from "../components/ui/vue/question.js";

export default () =>
  h(Question, {
    label: "Deploy questions",
    questions: [
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
    ],
    onSubmit: () => {},
  });
