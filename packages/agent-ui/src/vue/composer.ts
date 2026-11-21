import {
  type ComposerAttachmentsState,
  type ComposerInputState,
  type ComposerOptions,
  type ComposerRootState,
  type ComposerTriggerItem,
  type ComposerTriggerMenuState,
  composerPrimitive,
} from "@kind-ui/agent-ui/core";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/vue/file-input";
import { createParts, usePart, usePrimitive } from "@ui-sdk/vue/primitive";
import {
  type Token,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/vue/token-input";
import { defineComponent, h, type PropType } from "vue";
import { Attachments } from "./attachments.js";
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

// A part's slot state answers reads but lists no keys, so its objects are read key by key, never spread.
const fileInputProps = (fileInput: ComposerRootState["fileInput"]) => ({
  accept: fileInput.accept,
  maxSize: fileInput.maxSize,
  multiple: fileInput.multiple,
  disabled: fileInput.disabled,
  onValueChange: fileInput.onValueChange,
  onReject: fileInput.onReject,
});

const tokenInputProps = (tokenInput: ComposerInputState["tokenInput"]) => ({
  controller: tokenInput.controller,
  defaultValue: tokenInput.defaultValue,
  submitShortcut: tokenInput.submitShortcut,
  disabled: tokenInput.disabled,
});

const optional = { type: Boolean, default: undefined } as const;

// The generated root always hands the primitive an `onStop` that emits `stop`, so Stop would take Send's place
// without a listener. This root passes `onStop` only while the host listens, as React's does.
const Root = defineComponent({
  name: "ComposerRoot",
  inheritAttrs: false,
  props: {
    value: Object as PropType<ComposerOptions["value"]>,
    defaultValue: Object as PropType<ComposerOptions["defaultValue"]>,
    onValueChange: Function as PropType<NonNullable<ComposerOptions["onValueChange"]>>,
    onSubmit: Function as PropType<ComposerOptions["onSubmit"]>,
    onStop: Function as PropType<NonNullable<ComposerOptions["onStop"]>>,
    submitOn: String as PropType<ComposerOptions["submitOn"]>,
    mentions: Array as PropType<ComposerOptions["mentions"]>,
    commands: Array as PropType<ComposerOptions["commands"]>,
    accept: String,
    maxSize: Number,
    history: Array as PropType<ComposerOptions["history"]>,
    draftKey: String,
    draftStorage: Object as PropType<ComposerOptions["draftStorage"]>,
    disabled: optional,
    agentConfirm: optional,
    motion: String as PropType<ComposerOptions["motion"]>,
  },
  emits: ["update:value"],
  setup(props, { attrs, emit }) {
    const onValueChange: NonNullable<ComposerOptions["onValueChange"]> = (value, details) => {
      props.onValueChange?.(value, details);
      if (!details.canceled) emit("update:value", value);
    };
    const handle = usePrimitive(composerPrimitive, () => ({
      value: props.value,
      defaultValue: props.defaultValue,
      onValueChange,
      onSubmit: props.onSubmit,
      onStop: props.onStop,
      submitOn: props.submitOn,
      mentions: props.mentions,
      commands: props.commands,
      accept: props.accept,
      maxSize: props.maxSize,
      history: props.history,
      draftKey: props.draftKey,
      draftStorage: props.draftStorage,
      disabled: props.disabled,
      agentConfirm: props.agentConfirm,
      motion: props.motion,
    }));
    return usePart(handle, "root", undefined, () => attrs, "form");
  },
});

/**
 * A form whose content is a File Input drop zone: files attach by choosing, dropping, or pasting while focus is in it.
 * Name it with `aria-label`.
 */
export const Composer = defineComponent({
  name: "Composer",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(Root, attrs, {
        default: ({ state }: { state: ComposerRootState }) =>
          h(FileInput, fileInputProps(state.fileInput), () =>
            h(FileInputDropzone, null, () => slots.default?.()),
          ),
      });
  },
}) as unknown as typeof parts.Root;

const token = ({ token }: { token: Token }) =>
  h(TokenInputToken, null, () => [token.label, h(TokenInputTokenRemove)]);

/**
 * The prompt, a Token Input. Attributes go to its editor: name it with `aria-label`. Put `ComposerTriggerMenu` in
 * its default slot. To cancel a key, like Enter, use `@keydown.capture`: the Token Input handles keys before a
 * bubbling listener runs.
 */
export const ComposerInput = defineComponent({
  name: "ComposerInput",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Input, null, {
        default: ({ state }: { state: ComposerInputState }) =>
          h(TokenInput, tokenInputProps(state.tokenInput), {
            default: () => [h(TokenInputEditor, attrs), slots.default?.()],
            token,
          }),
      });
  },
});

/** Suggests `mentions` after `@` and `commands` after `/`; choosing one inserts a token. */
export const ComposerTriggerMenu = defineComponent({
  name: "ComposerTriggerMenu",
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h(parts.TriggerMenu, null, {
        default: ({ state }: { state: ComposerTriggerMenuState }) =>
          h(KindTriggerMenu, { triggers: state.triggers }, () =>
            h(KindTriggerMenuContent, attrs, () => [
              h(KindTriggerMenuEmpty, null, () => "No matches"),
              h(KindTriggerMenuList, null, {
                default: ({ state: list }: { state: { items: unknown[] } }) =>
                  (list.items as ComposerTriggerItem[]).map((item) =>
                    h(KindTriggerMenuItem, { key: item.value, value: item.value, label: item.label }, () => [
                      h("span", item.label),
                      item.description ? h("span", { "data-description": "" }, item.description) : null,
                    ]),
                  ),
              }),
            ]),
          ),
      });
  },
});

/** The draft's attachments, hidden while there are none. */
export const ComposerAttachments = defineComponent({
  name: "ComposerAttachments",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Attachments, null, {
        default: ({ state }: { state: ComposerAttachmentsState }) =>
          h(
            Attachments,
            {
              "aria-label": "Attachments",
              ...attrs,
              items: state.items,
              motion: state.motion,
              focusFallback: state.focusFallback,
              onRemove: state.onRemove,
            },
            slots,
          ),
      });
  },
});

/** Opens the file picker. */
export const ComposerAttach = defineComponent({
  name: "ComposerAttach",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(FileInputTrigger, { "aria-label": "Attach files", ...attrs }, slots);
  },
});

/** Empties a restored draft and removes it from `draftStorage`. */
export const ComposerDiscard = parts.Discard;

/** "Draft restored" with Discard, shown while a draft restored from `draftStorage` is still unedited. */
export const ComposerRestored = defineComponent({
  name: "ComposerRestored",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        parts.Restored,
        attrs,
        slots.default
          ? slots
          : () => [h("span", "Draft restored"), h(ComposerDiscard, null, () => "Discard")],
      );
  },
});

/** Sends the draft. Hidden while Stop shows. */
export const ComposerSubmit = parts.Submit;
/** Shown in Send's place while a submission is pending, when the composer has `onStop`. */
export const ComposerStop = parts.Stop;
