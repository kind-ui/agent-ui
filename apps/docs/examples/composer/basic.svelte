<script lang="ts">
  import {
    Composer,
    ComposerAttach,
    ComposerAttachments,
    ComposerInput,
    ComposerStop,
    ComposerSubmit,
    ComposerTriggerMenu,
  } from "@/components/ui/svelte/composer/index.js";

  const mentions = [
    { value: "src/client.ts", label: "client.ts", description: "src" },
    { value: "src/retry.ts", label: "retry.ts", description: "src" },
  ];

  const commands = [
    { value: "explain", label: "explain", description: "Explain the selected code" },
    { value: "test", label: "test", description: "Write tests" },
  ];

  let finish: (() => void) | undefined;
  const send = () =>
    new Promise<void>((resolve) => {
      finish = resolve;
      setTimeout(resolve, 3000);
    });
</script>

<Composer aria-label="Message" {mentions} {commands} onSubmit={send} onStop={() => finish?.()}>
  <ComposerAttachments />
  <ComposerInput aria-label="Prompt" placeholder="Ask anything. Type @ to mention, / for commands">
    <ComposerTriggerMenu />
  </ComposerInput>
  <ComposerAttach />
  <ComposerSubmit />
  <ComposerStop />
</Composer>
