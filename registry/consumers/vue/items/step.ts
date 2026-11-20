import { h } from "vue";
import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "../components/ui/vue/step.js";

export default () =>
  h(Step, { status: "complete" }, () => [
    h(StepTrigger, null, () => [h(StepIcon), h(StepTitle, null, () => "Read the logs")]),
    h(StepContent, null, () => h("p", "Three timeouts.")),
  ]);
