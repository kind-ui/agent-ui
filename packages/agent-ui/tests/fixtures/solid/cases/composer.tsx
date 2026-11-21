import type { ComposerDraft, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, flush, onSettled, Show } from "solid-js";
import { Attachments } from "../../../../src/solid/attachments.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/solid/composer.js";
import {
  attachmentItems,
  attachmentsHost,
  commands,
  draftOptions,
  history,
  mentions,
  recorder,
} from "../../shared/composer.js";
import { expose } from "../../shared/expose.js";

const unsettled = new Promise<void>(() => {});
type FullProps = {
  params: URLSearchParams;
  submitOn?: "enter" | "mod-enter";
  drafts: ReturnType<typeof draftOptions>;
} & ReturnType<typeof recorder>;

function Full(props: FullProps) {
  const [mounted, setMounted] = createSignal(true);
  const [draft, setDraft] = createSignal<ComposerDraft>({ text: "", tokens: [], attachments: [] });
  const [draftKey, setDraftKey] = createSignal(() => props.params.get("draftKey") ?? "chat-1");
  let frame: HTMLDivElement | undefined;
  onSettled(() => {
    expose({
      unmountComposer: () => {
        setMounted(false);
        flush();
      },
      remountComposer: () => {
        setMounted(true);
        flush();
      },
      setDraftKey: (key: string) => {
        setDraftKey(key);
        flush();
      },
    });
    const blockEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (window as { blockEnter?: boolean }).blockEnter) event.preventDefault();
    };
    frame?.addEventListener("keydown", blockEnter, true);
    return () => frame?.removeEventListener("keydown", blockEnter, true);
  });
  return (
    <div ref={frame} class="mx-auto max-w-xl p-6">
      <Show when={mounted()}>
        <Composer
          aria-label="Message"
          mentions={mentions}
          commands={commands}
          history={history}
          accept="image/*,.txt,.md"
          maxSize={3072}
          submitOn={props.submitOn ?? "enter"}
          onSubmit={props.onSubmit}
          draftStorage={props.drafts.draftStorage}
          draftKey={props.params.has("draft") ? draftKey() : props.drafts.draftKey}
          {...(props.params.has("controlled")
            ? {
                get value() {
                  return draft();
                },
              }
            : {})}
          onValueChange={(value, details) => {
            if ((window as { refuseEdits?: boolean }).refuseEdits) details.cancel();
            else setDraft(value);
          }}
          onStop={props.params.has("stop") ? props.onStop : undefined}
          motion={props.params.has("motion") ? (props.params.get("motion") as MotionMode) : undefined}
        >
          <ComposerAttachments />
          <ComposerInput aria-label="Prompt" placeholder="Ask anything. Type @ to mention, / for commands">
            <ComposerTriggerMenu />
          </ComposerInput>
          <ComposerAttach />
          <ComposerRestored />
          <ComposerSubmit />
          <ComposerStop />
        </Composer>
      </Show>
    </div>
  );
}

function AttachmentsCase(props: { params: URLSearchParams }) {
  const [items, setItems] = createSignal(attachmentItems());
  onSettled(() =>
    attachmentsHost((change) => {
      setItems(change);
      flush();
    }),
  );
  return (
    <div class="p-6">
      <Attachments
        aria-label="Files"
        items={items()}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        motion={props.params.has("motion") ? (props.params.get("motion") as MotionMode) : undefined}
      />
    </div>
  );
}

export const cases = {
  shell: () => (
    <Composer
      aria-label="Message"
      class="border-[rgb(1,2,3)] data-[pending]:opacity-50"
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
