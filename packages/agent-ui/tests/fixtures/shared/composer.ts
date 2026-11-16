import type { ComposerDraft, ComposerTriggerItem } from "@kind-ui/agent-ui/core";

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
