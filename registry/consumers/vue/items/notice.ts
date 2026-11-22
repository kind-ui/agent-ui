import { h } from "vue";
import { Notice } from "../components/ui/vue/notice.js";

export default () => h(Notice, { label: "Indexing your files" }, () => "Answers may miss new files.");
