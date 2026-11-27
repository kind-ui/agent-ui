import { type ComposerTriggerItem, composerPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/solid/file-input";
import { createParts } from "@ui-sdk/solid/primitive";
import {
  type Token,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/solid/token-input";
import { For, omit, Show } from "solid-js";
import { Attachments, type AttachmentsProps } from "./attachments.js";
import {
  KindTriggerMenu,
  KindTriggerMenuContent,
  KindTriggerMenuEmpty,
  KindTriggerMenuItem,
  KindTriggerMenuList,
} from "./internal/trigger-menu.js";

const parts = createParts(composerPrimitive, {
  root: "form",
  input: "div",
  "trigger-menu": "div",
  attachments: "div",
  submit: "button",
  stop: "button",
  restored: "div",
  discard: "button",
});

export type ComposerProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: JSX.Element };

/**
 * A form whose content is a File Input drop zone: files attach by choosing, dropping, or pasting while focus is in it.
 * Name it with `aria-label`.
 */
export function Composer(props: ComposerProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(state) => (
        <FileInput {...state.fileInput}>
          <FileInputDropzone>{props.children}</FileInputDropzone>
        </FileInput>
      )}
    </parts.Root>
  );
}

const renderToken = (token: Token) => (
  <TokenInputToken>
    {token.label}
    <TokenInputTokenRemove />
  </TokenInputToken>
);

export type ComposerInputProps = ComponentProps<typeof TokenInputEditor> & { children?: JSX.Element };

/**
 * The prompt, a Token Input. Props go to its editor: name it with `aria-label`. Put `ComposerTriggerMenu` inside.
 * To cancel a key, like Enter, listen in the capture phase: the Token Input handles keys on its editor first.
 */
export function ComposerInput(props: ComposerInputProps) {
  return (
    <parts.Input>
      {(state) => (
        <TokenInput {...state.tokenInput} renderToken={renderToken}>
          <TokenInputEditor {...omit(props, "children")} />
          {props.children}
        </TokenInput>
      )}
    </parts.Input>
  );
}

/** Suggests `mentions` after `@` and `commands` after `/`; choosing one inserts a token. */
export function ComposerTriggerMenu(props: ComponentProps<typeof KindTriggerMenuContent>) {
  return (
    <parts.TriggerMenu>
      {(state) => (
        <KindTriggerMenu triggers={state.triggers}>
          <KindTriggerMenuContent {...props}>
            <KindTriggerMenuEmpty>No matches</KindTriggerMenuEmpty>
            <KindTriggerMenuList>
              {(list) => (
                <For each={list.items as ComposerTriggerItem[]} keyed={(item) => item.value}>
                  {(item) => (
                    <KindTriggerMenuItem value={item().value} label={item().label}>
                      <span>{item().label}</span>
                      <Show when={item().description}>
                        <span data-description="">{item().description}</span>
                      </Show>
                    </KindTriggerMenuItem>
                  )}
                </For>
              )}
            </KindTriggerMenuList>
          </KindTriggerMenuContent>
        </KindTriggerMenu>
      )}
    </parts.TriggerMenu>
  );
}

/** The draft's attachments, hidden while there are none. */
export function ComposerAttachments(
  props: Omit<AttachmentsProps, "items" | "onRemove" | "focusFallback" | "motion">,
) {
  return (
    <parts.Attachments>
      {(state) => (
        <Attachments
          aria-label="Attachments"
          {...props}
          items={state.items}
          onRemove={state.onRemove}
          focusFallback={state.focusFallback}
          motion={state.motion}
        />
      )}
    </parts.Attachments>
  );
}

/** Opens the file picker. */
export function ComposerAttach(props: ComponentProps<typeof FileInputTrigger>) {
  return <FileInputTrigger aria-label="Attach files" {...props} />;
}

/** Empties a restored draft and removes it from `draftStorage`. */
export const ComposerDiscard = parts.Discard;

/** "Draft restored" with Discard, shown while a draft restored from `draftStorage` is still unedited. */
export function ComposerRestored(props: ComponentProps<typeof parts.Restored>) {
  return (
    <parts.Restored {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span>Draft restored</span>
          <ComposerDiscard>Discard</ComposerDiscard>
        </>
      )}
    </parts.Restored>
  );
}

/** Sends the draft. Hidden while Stop shows. */
export const ComposerSubmit = parts.Submit;
/** Shown in Send's place while a submission is pending, when the composer has `onStop`. */
export const ComposerStop = parts.Stop;
