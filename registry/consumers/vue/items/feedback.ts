import { h } from "vue";
import { Feedback } from "../components/ui/vue/feedback.js";

export default () => h(Feedback, { defaultRating: "up", onComment: () => {} });
