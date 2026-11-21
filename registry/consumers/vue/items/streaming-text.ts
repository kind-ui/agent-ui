import { h } from "vue";
import { StreamingText } from "../components/ui/vue/streaming-text.js";

export default () => h(StreamingText, { text: "Streaming text fades in", caret: true });
