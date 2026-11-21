import { h } from "vue";
import { Queue } from "../components/ui/vue/queue.js";

export default () =>
  h(Queue, { label: "Queue", items: [{ id: "tests", status: "pending", title: "Write the tests" }] });
