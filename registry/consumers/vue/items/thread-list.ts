import { h } from "vue";
import { ThreadList } from "../components/ui/vue/thread-list.js";

export default () =>
  h(ThreadList, {
    threads: [{ id: "a", title: "First chat", href: "#a" }],
    now: "2026-11-18",
    onNew: () => {},
  });
