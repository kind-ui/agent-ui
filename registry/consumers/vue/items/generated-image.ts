import { h } from "vue";
import { GeneratedImage } from "../components/ui/vue/generated-image.js";

export default () =>
  h(GeneratedImage, {
    alt: "A lighthouse at dusk",
    status: "generating",
    progress: 40,
    width: 768,
    height: 512,
  });
