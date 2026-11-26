import {
  type ComposerAttachmentsState,
  type ComposerInputState,
  type ComposerRootState,
  type ComposerSendMenuState,
  type ComposerSendMenuTriggerState,
  type ComposerSteerState,
  type ComposerTriggerItem,
  type ComposerTriggerMenuState,
  composerPrimitive,
} from "@kind-ui/agent-ui/core";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/vue/file-input";
import { MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import {
  type Token,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/vue/token-input";
import { defineComponent, Fragment, h } from "vue";
import { Attachments } from "./attachments.js";
import { KindMenu, KindMenuContent, KindMenuItem, KindMenuSeparator } from "./internal/menu.js";
import {
  KindTriggerMenu,
  KindTriggerMenuContent,
  KindTriggerMenuEmpty,
  KindTriggerMenuItem,
  KindTriggerMenuList,
} from "./internal/trigger-menu.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onStop`, whose presence puts Stop in Send's place while pending, is declared a function prop instead, which `@stop`
// binds. The generated root keeps `v-model` and `v-model:value`.
const primitive = Object.defineProperty(
  Object.assign((options: never) => composerPrimitive(options), composerPrimitive, {
    options: { ...composerPrimitive.options, onStop: "action" },
  }),
  "name",
  { value: composerPrimitive.name },
) as typeof composerPrimitive;

const parts = createParts(primitive, {
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

/**
 * A form whose content is a File Input drop zone: files attach by choosing, dropping, or pasting while focus is in it.
 * Name it with `aria-label`.
 */
export const Composer = defineComponent({
  name: "Composer",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
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
        render: slots.render,
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
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.TriggerMenu, null, {
        render: slots.render,
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
        render: slots.render,
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
            // `#render` is the part's; the chips' slot is the Attachments'.
            slots.default ? { default: slots.default } : undefined,
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
      h(parts.Restored, attrs, {
        ...slots,
        default:
          slots.default ?? (() => [h("span", "Draft restored"), h(ComposerDiscard, null, () => "Discard")]),
      });
  },
});

/** Sends the draft. Hidden while a turn runs or Stop shows. */
export const ComposerSubmit = parts.Submit;
/**
 * Shown in Send's place while a submission is pending or a turn is `running`, when the composer has `@stop`. Quiet
 * while Send shows beside it.
 */
export const ComposerStop = parts.Stop;

/** Send while a turn runs: "Steer" or "Queue" by `steerMode`, unless you fill the slot. */
export const ComposerSteer = defineComponent({
  name: "ComposerSteer",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Steer, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: ComposerSteerState }) => state.label),
      });
  },
}) as unknown as typeof parts.Steer;

const chevron = () => h("span", { "data-composer-chevron": "", "aria-hidden": "true" });

/** Opens Send's menu: UI SDK's `MenuTrigger`, a chevron unless you fill the slot. Attributes go to it. */
export const ComposerSendMenuTrigger = defineComponent({
  name: "ComposerSendMenuTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.SendMenuTrigger, null, {
        default: ({ state }: { state: ComposerSendMenuTriggerState }) =>
          // Hidden from agents, which use the composer's `steer`, `queue` and `stopAndSend`.
          h(
            MenuTrigger,
            {
              "aria-label": state["aria-label"],
              disabled: state.disabled,
              "data-agent-hidden": "",
              ...attrs,
            },
            { ...slots, default: slots.default ?? chevron },
          ),
      });
  },
});

const sendItems = (items: ComposerSendMenuState["items"]) =>
  items.map((item) =>
    h(Fragment, { key: item.value }, [
      item.value === "stop-and-send" ? h(KindMenuSeparator) : null,
      h(
        KindMenuItem,
        { value: item.value, label: item.label, "data-current": item.checked ? "" : undefined },
        () => [
          h("span", { "data-composer-check": "", "aria-hidden": "true" }),
          h("span", { "data-composer-send-text": "" }, [
            h("span", { "data-composer-send-label": "" }, item.label),
            h("span", { "data-composer-send-description": "" }, item.description),
          ]),
          item.shortcut ? h("kbd", { "data-composer-send-keys": "" }, item.shortcut) : null,
        ],
      ),
    ]),
  );

/**
 * Send and its menu while a turn runs, shown once there's text when the composer has `@steer`: Steer or Queue, and
 * a chevron offering Steer now, Queue for later and Stop and send, each with its keys. Put it beside `ComposerStop`.
 */
export const ComposerSendMenu = defineComponent({
  name: "ComposerSendMenu",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.SendMenu, attrs, {
        default: ({ state }: { state: ComposerSendMenuState }) =>
          h(
            KindMenu,
            {
              controller: state.controller,
              open: state.open,
              onOpenChange: state.onOpenChange,
              onAction: state.onAction,
            },
            () =>
              slots.default?.() ?? [
                h(ComposerSteer),
                h(ComposerSendMenuTrigger),
                h(
                  KindMenuContent,
                  { align: "end", side: "top", sideOffset: 8, "data-composer-send-menu": "" },
                  () => sendItems(state.items),
                ),
              ],
          ),
      });
  },
});
