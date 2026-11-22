import {
  type ShareDialogActionState,
  type ShareDialogLinkState,
  type ShareDialogVisibilityState,
  shareDialogPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Input } from "@ui-sdk/solid/input";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import {
  KindSegmentedControl,
  KindSegmentedControlIndicator,
  KindSegmentedControlItem,
} from "./internal/segmented-control.js";

const parts = createParts(shareDialogPrimitive, {
  root: "div",
  trigger: "button",
  backdrop: "div",
  viewport: "div",
  content: "div",
  title: "h2",
  description: "p",
  visibility: "div",
  link: "div",
  create: "button",
  copy: "button",
  revoke: "button",
  error: "p",
  close: "button",
});

export type ShareDialogProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};
export type ShareDialogTriggerProps = ComponentProps<typeof parts.Trigger>;
export type ShareDialogContentProps = ComponentProps<typeof parts.Content>;
export type ShareDialogTitleProps = ComponentProps<typeof parts.Title>;
export type ShareDialogDescriptionProps = ComponentProps<typeof parts.Description>;
export type ShareDialogVisibilityProps = ComponentProps<typeof parts.Visibility>;
export type ShareDialogLinkProps = ComponentProps<typeof parts.Link>;
export type ShareDialogCreateProps = ComponentProps<typeof parts.Create>;
export type ShareDialogCopyProps = ComponentProps<typeof parts.Copy>;
export type ShareDialogRevokeProps = ComponentProps<typeof parts.Revoke>;
export type ShareDialogErrorProps = ComponentProps<typeof parts.Error>;
export type ShareDialogCloseProps = ComponentProps<typeof parts.Close>;

/** Opens the dialog. Its `label`, after a share glyph, unless you pass children. */
export function ShareDialogTrigger(props: ShareDialogTriggerProps) {
  return (
    <parts.Trigger {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Trigger>
  );
}

/** Dims the page behind the dialog. */
export const ShareDialogBackdrop = parts.Backdrop;

/** The dialog's title, the `dialogLabel`, unless you pass children. */
export function ShareDialogTitle(props: ShareDialogTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
  );
}

/** Who can open the chat, in words, unless you pass children. Describes the dialog. */
export function ShareDialogDescription(props: ShareDialogDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Description>
  );
}

const visibilityControl = (control: ShareDialogVisibilityState) => (
  // Hidden from agents, which use the Share Dialog's own `setVisibility`.
  <KindSegmentedControl
    controller={control.controller}
    defaultValue={control.defaultValue}
    aria-label={control["aria-label"]}
    data-agent-hidden=""
  >
    <KindSegmentedControlIndicator />
    <For each={control.options} keyed={(option) => option.value}>
      {(option) => (
        <KindSegmentedControlItem value={option().value}>{option().label}</KindSegmentedControlItem>
      )}
    </For>
  </KindSegmentedControl>
);

/** "Only you" or "Anyone with the link", a UI SDK Segmented Control, unless you pass children. */
export function ShareDialogVisibility(props: ShareDialogVisibilityProps) {
  return (
    <parts.Visibility {...omit(props, "children")}>{props.children ?? visibilityControl}</parts.Visibility>
  );
}

const linkInput = (input: ShareDialogLinkState) => (
  <Input
    value={input.value}
    readonly={input.readOnly}
    aria-label={input["aria-label"]}
    data-agent-hidden=""
  />
);

/** The `link`, in a read-only UI SDK Input, unless you pass children. */
export function ShareDialogLink(props: ShareDialogLinkProps) {
  return <parts.Link {...omit(props, "children")}>{props.children ?? linkInput}</parts.Link>;
}

const pendingLabel = (label: string, pending: string) => (state: ShareDialogActionState) => (
  <Show when={state.pending} fallback={label}>
    <span aria-hidden="true" data-status-mark="" data-status="running" data-motion={state.motion} />
    {pending}
  </Show>
);

/** Calls `onCreateLink`. "Create link", or "Creating link" with a running mark while pending, unless you pass children. */
export function ShareDialogCreate(props: ShareDialogCreateProps) {
  return (
    <parts.Create {...omit(props, "children")}>
      {props.children ?? pendingLabel("Create link", "Creating link")}
    </parts.Create>
  );
}

/** Copies the `link`. "Copy link", then "Copied" for 2 s, unless you pass children. */
export function ShareDialogCopy(props: ShareDialogCopyProps) {
  return (
    <parts.Copy {...omit(props, "children")}>
      {props.children ?? ((state: { copied: boolean }) => (state.copied ? "Copied" : "Copy link"))}
    </parts.Copy>
  );
}

/** Calls `onRevoke`. "Stop sharing", or "Stopping" with a running mark while pending, unless you pass children. */
export function ShareDialogRevoke(props: ShareDialogRevokeProps) {
  return (
    <parts.Revoke {...omit(props, "children")}>
      {props.children ?? pendingLabel("Stop sharing", "Stopping")}
    </parts.Revoke>
  );
}

/** Why the last create or revoke failed, unless you pass children. */
export function ShareDialogError(props: ShareDialogErrorProps) {
  return (
    <parts.Error {...omit(props, "children")}>
      {props.children ?? ((state: { message: string }) => state.message)}
    </parts.Error>
  );
}

/** Closes the dialog and returns focus to the trigger. "Done", unless you pass children. */
export function ShareDialogClose(props: ShareDialogCloseProps) {
  return <parts.Close {...omit(props, "children")}>{props.children ?? "Done"}</parts.Close>;
}

type Render = (props: Record<string, unknown>, state: { presentation?: string }) => JSX.Element;

/** The dialog: its title, who can open the chat, the link and its actions, unless you pass children. */
export function ShareDialogContent(props: ShareDialogContentProps) {
  const render = (content: Record<string, unknown>, state: { presentation?: string }) => {
    const element = () => {
      const own = props.render as Render | undefined;
      return own ? own(content, state) : <div {...content} />;
    };
    // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
    return (
      <Show when={state.presentation === "sheet"} fallback={element()}>
        <parts.Viewport>{element()}</parts.Viewport>
      </Show>
    );
  };
  return (
    <parts.Content
      {...omit(props, "children", "render")}
      render={render as ShareDialogContentProps["render"]}
    >
      {props.children ?? (
        <>
          <div data-share-dialog-header="">
            <ShareDialogTitle />
            <ShareDialogDescription />
          </div>
          <ShareDialogVisibility />
          <div data-share-dialog-link-row="">
            <ShareDialogCreate />
            <ShareDialogLink />
            <ShareDialogCopy />
          </div>
          <div data-share-dialog-footer="">
            <ShareDialogError />
            <ShareDialogRevoke />
            <ShareDialogClose />
          </div>
        </>
      )}
    </parts.Content>
  );
}

/**
 * A Share button whose dialog chooses who can open the chat and shows the link the host makes, with Copy link and
 * Stop sharing. Any `children` replace the trigger and the dialog.
 */
export function ShareDialog(props: ShareDialogProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ShareDialogTrigger />
          <ShareDialogBackdrop />
          <ShareDialogContent />
        </>
      )}
    </parts.Root>
  );
}
