import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Attachments } from "../../../../src/react/attachments.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/react/composer.js";
import {
  attachmentItems,
  attachmentsHost,
  commands,
  history,
  mentions,
  recorder,
} from "../../shared/composer.js";

const unsettled = new Promise<void>(() => {});
const params = new URLSearchParams(location.search);
const { onSubmit, onStop } = recorder();

function Full({ submitOn }: { submitOn?: "enter" | "mod-enter" }) {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    Object.assign(window, { unmountComposer: () => setMounted(false) });
  }, []);
  if (!mounted) return null;
  return (
    <div className="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        mentions={mentions}
        commands={commands}
        history={history}
        accept="image/*,.txt,.md"
        maxSize={3072}
        submitOn={submitOn ?? "enter"}
        onSubmit={onSubmit}
        onValueChange={(_value, details) => {
          if ((window as { refuseEdits?: boolean }).refuseEdits) details.cancel();
        }}
        {...(params.has("stop") ? { onStop } : {})}
        {...(params.has("motion") ? { motion: params.get("motion") as MotionMode } : {})}
      >
        <ComposerAttachments />
        <ComposerInput
          aria-label="Prompt"
          placeholder="Ask anything. Type @ to mention, / for commands"
          onKeyDownCapture={(event) => {
            if (event.key === "Enter" && (window as { blockEnter?: boolean }).blockEnter)
              event.preventDefault();
          }}
        >
          <ComposerTriggerMenu />
        </ComposerInput>
        <ComposerAttach />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}

function AttachmentsCase() {
  const [items, setItems] = useState(attachmentItems);
  useEffect(() => attachmentsHost(setItems), []);
  return (
    <div className="p-6">
      <Attachments
        aria-label="Files"
        items={items}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        {...(params.has("motion") ? { motion: params.get("motion") as MotionMode } : {})}
      />
    </div>
  );
}

export const cases = {
  shell: () => (
    <Composer
      aria-label="Message"
      className="border-[rgb(1,2,3)] data-[pending]:opacity-50"
      onSubmit={() => unsettled}
    >
      <ComposerInput aria-label="Prompt" />
      <ComposerSubmit>Send</ComposerSubmit>
    </Composer>
  ),
  full: () => <Full />,
  "mod-enter": () => <Full submitOn="mod-enter" />,
  attachments: () => <AttachmentsCase />,
};
