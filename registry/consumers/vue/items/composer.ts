import { h } from "vue";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "../components/ui/vue/composer.js";

export default () =>
  h(Composer, { "aria-label": "Message" }, () => [
    h(ComposerInput, { "aria-label": "Prompt" }),
    h(ComposerSubmit),
    h(ComposerStop),
  ]);
