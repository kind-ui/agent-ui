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
  const generating = progress < 100;

  useEffect(() => {
    if (progress >= 100) return;
    const timer = setTimeout(() => setProgress(progress + 10), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <GeneratedImage
        alt="A lighthouse at dusk"
        status={generating ? "generating" : "ready"}
        progress={progress}
        preview={progress >= 40 ? preview.src : undefined}
        src={lighthouse.src}
        width={lighthouse.width}
        height={lighthouse.height}
        onDownload={save}
        className="w-full"
      />
      <button type="button" className="text-sm underline" onClick={() => setProgress(0)}>
        Generate again
      </button>
    </div>
  );
}
