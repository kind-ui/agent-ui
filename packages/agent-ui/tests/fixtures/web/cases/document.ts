import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineDocument } from "../../../../src/web/document.js";
import { chunks, code, downloads, notes, readme } from "../../shared/document.js";

const create = (id: string, label: string, props: Record<string, unknown>) => {
  const element = document.createElement("kind-document");
  element.id = id;
  element.label = label;
  Object.assign(element, props);
  return element;
};

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineDocument();
    const recorded: { downloads: [string | undefined, string][] } = { downloads: [] };
    const container = document.createElement("div");
    container.className = "flex w-[34rem] flex-col gap-4 p-6";
    const readmeElement = create("readme", "README.md", { content: readme, downloads });
    readmeElement.canDownload = true;
    if (motion) readmeElement.motion = motion;
    readmeElement.addEventListener("download", (event) =>
      recorded.downloads.push([event.detail.value, event.detail.source]),
    );
    container.append(
      readmeElement,
      create("code", "backoff.ts", { format: "code", language: "ts", content: code }),
      create("notes", "notes.txt", { format: "text", content: notes }),
    );
    root.append(container);
    Object.assign(window, { kindHost: recorded });
  };

const streaming = (root: HTMLElement) => {
  defineDocument();
  const container = document.createElement("div");
  container.className = "w-[34rem] p-6";
  const element = create("streaming", "README.md", { content: "", streaming: true });
  element.canDownload = true;
  container.append(element);
  root.append(container);
  let count = 0;
  Object.assign(window, {
    kindHost: {
      next: () => {
        count = Math.min(count + 1, chunks.length);
        element.content = chunks.slice(0, count).join("");
        element.streaming = count < chunks.length;
      },
    },
  });
};

const written = (root: HTMLElement) => {
  defineDocument();
  root.innerHTML = `<div class="w-[34rem] p-6">
    <kind-document id="written" label="notes.txt" can-download>
      <kind-document-header>
        <kind-document-title></kind-document-title>
        <kind-document-toolbar>
          <kind-internal-toolbar><ui-toolbar aria-label="Document actions">
            <kind-document-download><ui-toolbar-button><button>Save</button></ui-toolbar-button></kind-document-download>
          </ui-toolbar></kind-internal-toolbar>
        </kind-document-toolbar>
      </kind-document-header>
      <kind-document-body><kind-document-content>Server-rendered notes</kind-document-content></kind-document-body>
    </kind-document>
  </div>`;
};

export const cases = { all: page(), reduced: page({ motion: "reduced" }), streaming, written };
