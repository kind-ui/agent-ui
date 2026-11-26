"use client";

import { type ComposerTriggerItem, composerPrimitive } from "@kind-ui/agent-ui/core";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/react/file-input";
import { MenuTrigger } from "@ui-sdk/react/menu";
import { createParts } from "@ui-sdk/react/primitive";
import {
  type Token,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/react/token-input";
import { type ComponentProps, Fragment, type ReactNode } from "react";
import { Attachments, type AttachmentsProps } from "./attachments.js";
import { KindMenu, KindMenuContent, KindMenuItem, KindMenuSeparator } from "./internal/menu.js";
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
  "send-menu": "div",
  "send-menu-trigger": "span",
  stop: "button",
  restored: "div",
  discard: "button",
});

export type ComposerProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: ReactNode };

/**
 * A form whose content is a File Input drop zone: files attach by choosing, dropping, or pasting while focus is in it.
 * Name it with `aria-label`.
 */
export function Composer({ children, ...props }: ComposerProps) {
  return (
    <parts.Root {...props}>
      {({ fileInput }) => (
        <FileInput {...fileInput}>
          <FileInputDropzone>{children}</FileInputDropzone>
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

export type ComposerInputProps = ComponentProps<typeof TokenInputEditor> & { children?: ReactNode };

/**
 * The prompt, a Token Input. Props go to its editor: name it with `aria-label`. Put `ComposerTriggerMenu` inside.
 * To cancel a key, like Enter, use `onKeyDownCapture`: the Token Input handles keys before `onKeyDown` runs.
 */
export function ComposerInput({ children, ...props }: ComposerInputProps) {
  return (
    <parts.Input>
      {({ tokenInput }) => (
        <TokenInput {...tokenInput} renderToken={renderToken}>
          <TokenInputEditor {...props} />
          {children}
        </TokenInput>
      )}
    </parts.Input>
  );
}

/** Suggests `mentions` after `@` and `commands` after `/`; choosing one inserts a token. */
export function ComposerTriggerMenu(props: ComponentProps<typeof KindTriggerMenuContent>) {
  return (
    <parts.TriggerMenu>
      {({ triggers }) => (
        <KindTriggerMenu triggers={triggers}>
          <KindTriggerMenuContent {...props}>
            <KindTriggerMenuEmpty>No matches</KindTriggerMenuEmpty>
            <KindTriggerMenuList>
              {(state) =>
                (state.items as ComposerTriggerItem[]).map((item) => (
                  <KindTriggerMenuItem key={item.value} value={item.value} label={item.label}>
                    <span>{item.label}</span>
                    {item.description ? <span data-description="">{item.description}</span> : null}
                  </KindTriggerMenuItem>
                ))
              }
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
      {(attachments) => <Attachments aria-label="Attachments" {...props} {...attachments} />}
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
export function ComposerRestored({ children, ...props }: ComponentProps<typeof parts.Restored>) {
  return (
    <parts.Restored {...props}>
      {children ?? (
        <>
          <span>Draft restored</span>
          <ComposerDiscard>Discard</ComposerDiscard>
        </>
      )}
    </parts.Restored>
  );
}

/** Sends the draft. Hidden while a turn runs or Stop shows. */
export const ComposerSubmit = parts.Submit;
/**
 * Shown in Send's place while a submission is pending or a turn is `running`, when the composer has `onStop`. Quiet
 * while Send shows beside it.
 */
export const ComposerStop = parts.Stop;

export type ComposerSteerProps = ComponentProps<typeof parts.Steer>;

/** Send while a turn runs: "Steer" or "Queue" by `steerMode`, unless you pass children. */
export function ComposerSteer({ children, ...props }: ComposerSteerProps) {
  return <parts.Steer {...props}>{children ?? (({ label }) => label)}</parts.Steer>;
}

export type ComposerSendMenuTriggerProps = ComponentProps<typeof MenuTrigger>;

/** Opens Send's menu: UI SDK's `MenuTrigger`, a chevron unless you pass children. */
export function ComposerSendMenuTrigger({ children, ...props }: ComposerSendMenuTriggerProps) {
  return (
    <parts.SendMenuTrigger>
      {(trigger) => (
        // Hidden from agents, which use the composer's `steer`, `queue` and `stopAndSend`.
        <MenuTrigger {...trigger} data-agent-hidden="" {...props}>
          {children ?? <span data-composer-chevron="" aria-hidden="true" />}
        </MenuTrigger>
      )}
    </parts.SendMenuTrigger>
  );
}

export type ComposerSendMenuProps = Omit<ComponentProps<typeof parts.SendMenu>, "children"> & {
  children?: ReactNode;
};

/**
 * Send and its menu while a turn runs, shown once there's text when the composer has `onSteer`: Steer or Queue, and
 * a chevron offering Steer now, Queue for later and Stop and send, each with its keys. Put it beside `ComposerStop`.
 */
export function ComposerSendMenu({ children, ...props }: ComposerSendMenuProps) {
  return (
    <parts.SendMenu {...props}>
      {({ items, controller, open, onOpenChange, onAction }) => (
        <KindMenu controller={controller} open={open} onOpenChange={onOpenChange} onAction={onAction}>
          {children ?? (
            <>
              <ComposerSteer />
              <ComposerSendMenuTrigger />
              <KindMenuContent align="end" side="top" sideOffset={8} data-composer-send-menu="">
                {items.map((item) => (
                  <Fragment key={item.value}>
                    {item.value === "stop-and-send" ? <KindMenuSeparator /> : null}
                    <KindMenuItem
                      value={item.value}
                      label={item.label}
                      data-current={item.checked ? "" : undefined}
                    >
                      <span data-composer-check="" aria-hidden="true" />
                      <span data-composer-send-text="">
                        <span data-composer-send-label="">{item.label}</span>
                        <span data-composer-send-description="">{item.description}</span>
                      </span>
                      {item.shortcut ? <kbd data-composer-send-keys="">{item.shortcut}</kbd> : null}
                    </KindMenuItem>
                  </Fragment>
                ))}
              </KindMenuContent>
            </>
          )}
        </KindMenu>
      )}
    </parts.SendMenu>
  );
}
