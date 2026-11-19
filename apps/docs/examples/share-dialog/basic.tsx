"use client";
import { useState } from "react";
import { ShareDialog } from "@/components/ui/share-dialog";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ShareDialogExample() {
  const [visibility, setVisibility] = useState<"private" | "link">("private");
  const [link, setLink] = useState<string>();

  return (
    <ShareDialog
      visibility={visibility}
      onVisibilityChange={setVisibility}
      link={link}
      onCreateLink={async () => {
        await wait(800);
        setLink("https://example.com/share/billing-export-retries");
      }}
      onRevoke={async () => {
        await wait(400);
        setLink(undefined);
        setVisibility("private");
      }}
    />
  );
}
