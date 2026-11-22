import { createSignal } from "solid-js";
import { ShareDialog } from "@/components/ui/solid/share-dialog";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ShareDialogExample() {
  const [visibility, setVisibility] = createSignal<"private" | "link">("private");
  const [link, setLink] = createSignal<string>();

  return (
    <ShareDialog
      visibility={visibility()}
      onVisibilityChange={setVisibility}
      link={link()}
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
