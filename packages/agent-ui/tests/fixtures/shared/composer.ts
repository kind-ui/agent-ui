import type {
  AttachmentItem,
  ComposerDraft,
  ComposerOptions,
  ComposerTriggerItem,
} from "@kind-ui/agent-ui/core";
import { createLocalStorage, type ValueStorage } from "@ui-sdk/core";

export const mentions: ComposerTriggerItem[] = [
  { value: "ada", label: "Ada Lovelace", description: "Research" },
  { value: "grace", label: "Grace Hopper", description: "Compilers" },
  { value: "alan", label: "Alan Turing", description: "Theory" },
];

export const commands: ComposerTriggerItem[] = [
  { value: "summarize", label: "summarize", description: "Summarize the thread" },
  { value: "explain", label: "explain", description: "Explain the selection" },
];

export const history = ["What changed in the last release?", "Summarize the open issues"];

type Submission = { draft: ComposerDraft; resolve: () => void; reject: () => void };

/** Each submit waits until the test settles it through `window.kindComposer`. */
export function recorder() {
  const submissions: Submission[] = [];
  const stops: number[] = [];
  const onSubmit = (draft: ComposerDraft) =>
    new Promise<void>((resolve, reject) =>
      submissions.push({ draft, resolve, reject: () => reject(new Error("failed")) }),
    );
  const onStop = () => void stops.push(submissions.length);
  Object.assign(window, { kindComposer: { submissions, stops } });
  return { onSubmit, onStop };
}

export const imageFile = () =>
  new File(
    [
      Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAI0lEQVR4nGP8z4AdMOERHyYSLAwM/zHEGBkYGBiQJBhxGAgAPP0FAkvB8m0AAAAASUVORK5CYII=",
        ),
        (char) => char.charCodeAt(0),
      ),
    ],
    "diagram.png",
    { type: "image/png" },
  );

export const attachmentItems = (): AttachmentItem[] => [
  { id: "a", name: "diagram.png", size: 2048, mediaType: "image/png", file: imageFile() },
  { id: "b", name: "notes.md", size: 812, mediaType: "text/markdown" },
  { id: "c", name: "archive.zip", size: 9_000_000, mediaType: "application/zip", error: "type" },
];

export function attachmentsHost(update: (change: (items: AttachmentItem[]) => AttachmentItem[]) => void) {
  const all = attachmentItems();
  Object.assign(window, {
    kindAttachments: {
      remove: (id: string) => update((items) => items.filter((item) => item.id !== id)),
      add: (id: string) =>
        update((items) => [...items, all.find((item) => item.id === id) as AttachmentItem]),
    },
  });
}

export function draftOptions(params: URLSearchParams): Pick<ComposerOptions, "draftKey" | "draftStorage"> {
  if (!params.has("draft")) return {};
  const local = createLocalStorage("kind-drafts");
  const calls: string[] = [];
  const fail = params.get("draft") === "throws";
  const draftStorage: ValueStorage = {
    ...local,
    get: () => (calls.push("get"), local.get()),
    set: (value) => {
      calls.push("set");
      if (fail) throw new DOMException("Full", "QuotaExceededError");
      return local.set(value);
    },
    remove: () => (calls.push("remove"), local.remove()),
  };
  Object.assign(window, { kindDrafts: { calls } });
  return { draftKey: params.get("draftKey") ?? "chat-1", draftStorage };
}
