import { h } from "vue";
import { Transcript } from "../components/ui/vue/transcript.js";

export default () =>
  h(Transcript, {
    segments: [{ id: "1", speaker: "Priya", start: 0, end: 4, text: "Let's start with the checklist." }],
    currentTime: 1,
    onSeek: () => {},
  });
