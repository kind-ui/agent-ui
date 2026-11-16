"use client";

import { useEffect, useState } from "react";
import { GeneratedImage } from "@/components/ui/generated-image";
import lighthouse from "./lighthouse.png";
import preview from "./lighthouse-preview.png";

function save() {
  const link = document.createElement("a");
  link.href = lighthouse.src;
  link.download = "lighthouse.png";
  link.click();
}

export default function GeneratedImageExample() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) return;
    const timer = setTimeout(() => setProgress(progress + 5), 250);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <GeneratedImage
        alt="A lighthouse at dusk"
        status={progress < 100 ? "generating" : "ready"}
        progress={progress}
        preview={progress >= 30 ? preview.src : undefined}
        src={lighthouse.src}
        width={lighthouse.width}
        height={lighthouse.height}
        onDownload={save}
        className="w-full"
      />
      <button type="button" className="text-sm underline" onClick={() => setProgress(0)}>
        Replay
      </button>
    </div>
  );
}
