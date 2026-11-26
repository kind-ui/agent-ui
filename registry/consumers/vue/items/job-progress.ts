import { h } from "vue";
import { JobProgress } from "../components/ui/vue/job-progress.js";

export default () =>
  h(
    JobProgress,
    {
      label: "Build docs",
      status: "running",
      value: 0.42,
      stage: "Installing dependencies",
      defaultOpen: true,
    },
    () => h("pre", "$ npm ci"),
  );
