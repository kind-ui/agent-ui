import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/react/composer.js";

const unsettled = new Promise<void>(() => {});

export const cases = {
  shell: () => (
    <Composer
      aria-label="Message"
      className="flex gap-2 border border-[rgb(1,2,3)] p-2 data-[pending]:opacity-50"
      onSubmit={() => unsettled}
    >
      <ComposerInput aria-label="Message" className="flex-1" />
      <ComposerSubmit>Send</ComposerSubmit>
    </Composer>
  ),
};
