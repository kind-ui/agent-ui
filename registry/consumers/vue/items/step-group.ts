import { h } from "vue";
import { StepGroup } from "../components/ui/step-group.js";

export default () =>
  h(
    StepGroup,
    {
      label: "Read 3 files",
      items: [
        { id: "a", status: "complete" },
        { id: "b", status: "complete" },
        { id: "c", status: "complete" },
      ],
      defaultOpen: true,
    },
    () => h("p", "Read three files."),
  );
