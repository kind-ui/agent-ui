import { h } from "vue";
import { StepGroup } from "../components/ui/vue/step-group.js";

export default () =>
  h(StepGroup, { label: "Read 2 files", status: "complete", defaultOpen: true }, () =>
    h("p", "Read two files."),
  );
