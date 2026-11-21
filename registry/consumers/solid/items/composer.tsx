import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "../components/ui/solid/composer.js";

export default function ComposerItem() {
  return (
    <Composer aria-label="Message">
      <ComposerInput aria-label="Prompt" />
      <ComposerSubmit />
      <ComposerStop />
    </Composer>
  );
}
