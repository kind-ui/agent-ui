import type { ComposerDraft, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Attachments } from "../../../../src/react/attachments.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/react/composer.js";
import {
  attachmentItems,
  attachmentsHost,
  commands,
  draftOptions,
  history,
  mentions,
  recorder,
} from "../../shared/composer.js";

const unsettled = new Promise<void>(() => {});
type FullProps = {
  params: URLSearchParams;
  submitOn?: "enter" | "mod-enter";
  drafts: ReturnType<typeof draftOptions>;
} & ReturnType<typeof recorder>;

function Full({ params, submitOn, drafts, onSubmit, onStop }: FullProps) {
  const [mounted, setMounted] = useState(true);
  const [draft, setDraft] = useState<ComposerDraft>({ text: "", tokens: [], attachments: [] });
  const [draftKey, setDraftKey] = useState(params.get("draftKey") ?? "chat-1");
  useEffect(() => {
    Object.assign(window, {
      unmountComposer: () => setMounted(false),
      remountComposer: () => setMounted(true),
      setDraftKey,
    });
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
        {...drafts}
        {...(params.has("draft") ? { draftKey } : {})}
        {...(params.has("controlled") ? { value: draft } : {})}
        onValueChange={(value, details) => {
          if ((window as { refuseEdits?: boolean }).refuseEdits) details.cancel();
          else setDraft(value);
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
        <ComposerRestored />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}

function AttachmentsCase({ params }: { params: URLSearchParams }) {
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
  full: (params: URLSearchParams) => <Full params={params} drafts={draftOptions(params)} {...recorder()} />,
  "mod-enter": (params: URLSearchParams) => (
    <Full params={params} submitOn="mod-enter" drafts={draftOptions(params)} {...recorder()} />
  ),
  attachments: (params: URLSearchParams) => <AttachmentsCase params={params} />,
};
