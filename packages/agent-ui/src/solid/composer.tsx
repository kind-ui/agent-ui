import { type ComposerTriggerItem, composerPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/solid/file-input";
import { MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import {
  type Token,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/solid/token-input";
import { createSignal, For, omit, onFlush, onSettled, Show } from "solid-js";
import { Attachments, type AttachmentsProps } from "./attachments.js";
import { KindMenu, KindMenuContent, KindMenuItem } from "./internal/menu.js";
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
  steer: "button",
  "steer-menu": "div",
  "steer-menu-trigger": "span",
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
  // Trigger Menu writes its editor attributes as it connects, only if the editor's element is attached by then, and
  // UI SDK attaches the editor as it settles. Created once that flush has applied, the menu writes them at rest.
  const [settled, setSettled] = createSignal(false);
  onSettled(() => {
    onFlush(() => setSettled(true));
  });
  return (
    <parts.TriggerMenu>
      {(state) => (
        <Show when={settled()}>
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
        </Show>
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
/** Shown in Send's place while a submission is pending or `running`, when the composer has `onStop`. */
export const ComposerStop = parts.Stop;

export type ComposerSteerProps = ComponentProps<typeof parts.Steer>;

/** Send while a turn runs: "Steer" or "Queue" by `steerMode`, unless you pass children. */
export function ComposerSteer(props: ComposerSteerProps) {
  return (
    <parts.Steer {...omit(props, "children")}>
      {props.children ??
        ((state: { label: string }) => (
          <>
            {state.label}
            <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          </>
        ))}
    </parts.Steer>
  );
}

export type ComposerSteerMenuTriggerProps = ComponentProps<typeof MenuTrigger>;

/** Opens the menu of send modes: UI SDK's `MenuTrigger`, a chevron unless you pass children. */
export function ComposerSteerMenuTrigger(props: ComposerSteerMenuTriggerProps) {
  return (
    <parts.SteerMenuTrigger>
      {(trigger) => (
        // Hidden from agents, which use the composer's `steer` and `queue`.
        <MenuTrigger
          aria-label={trigger["aria-label"]}
          disabled={trigger.disabled}
          data-agent-hidden=""
          data-kind-icon-button=""
          data-kind-size="lg"
          {...omit(props, "children")}
        >
          {props.children ?? <span data-composer-chevron="" aria-hidden="true" />}
        </MenuTrigger>
      )}
    </parts.SteerMenuTrigger>
  );
}

export type ComposerSteerMenuProps = Omit<ComponentProps<typeof parts.SteerMenu>, "children"> & {
  children?: JSX.Element;
};

/**
 * Send, its menu of modes and Stop's neighbor while a turn runs and the composer has `onSteer`: Steer or Queue, and
 * a chevron offering "Steer now" and "Queue for next turn". Put it beside `ComposerSubmit` and `ComposerStop`.
 */
export function ComposerSteerMenu(props: ComposerSteerMenuProps) {
  return (
    <parts.SteerMenu {...omit(props, "children")}>
      {(menu) => (
        <KindMenu controller={menu.controller} onOpenChange={menu.onOpenChange} onAction={menu.onAction}>
          {props.children ?? (
            <>
              <ComposerSteer />
              <ComposerSteerMenuTrigger />
              <KindMenuContent align="end" side="top" sideOffset={6}>
                <For each={menu.items} keyed={(item) => item.value}>
                  {(item) => (
                    <KindMenuItem
                      value={item().value}
                      label={item().label}
                      shortcut={item().shortcut}
                      disabled={item().disabled}
                    >
                      {item().label}
                    </KindMenuItem>
                  )}
                </For>
              </KindMenuContent>
            </>
          )}
        </KindMenu>
      )}
    </parts.SteerMenu>
  );
}
