import { createEffect, createSignal } from "solid-js";
import { GeneratedImage } from "@/components/ui/solid/generated-image";
import lighthouse from "./lighthouse.png";
import preview from "./lighthouse-preview.png";

function save() {
  const link = document.createElement("a");
  link.href = lighthouse;
  link.download = "lighthouse.png";
  link.click();
}

export default function GeneratedImageExample() {
  const [progress, setProgress] = createSignal(0);

  createEffect(progress, (value) => {
    if (value >= 100) return;
    const timer = setTimeout(() => setProgress(value + 5), 250);
    return () => clearTimeout(timer);
  });

  return (
    <div class="flex w-full max-w-md flex-col items-start gap-3">
      <GeneratedImage
        alt="A lighthouse at dusk"
        status={progress() < 100 ? "generating" : "ready"}
        progress={progress()}
        preview={progress() >= 30 ? preview : undefined}
        src={lighthouse}
        width={768}
        height={512}
        onDownload={save}
        class="w-full"
      />
      <button
        type="button"
        class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm hover:bg-[var(--kind-color-hover)]"
        onClick={() => setProgress(0)}
      >
        Replay
      </button>
    </div>
  );
}
