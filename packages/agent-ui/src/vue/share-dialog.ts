import {
  type ShareDialogActionState,
  type ShareDialogLinkState,
  type ShareDialogVisibilityState,
  shareDialogPrimitive,
} from "@kind-ui/agent-ui/core";
import { Input } from "@ui-sdk/vue/input";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slots } from "vue";
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

function withDefault<C extends Component>(part: C, name: string, fallback: (scope: never) => unknown): C {
  const Part = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? fallback } as Slots);
    },
  });
  return Part as unknown as C;
}

/** Opens the dialog. Its `label`, after a share glyph, unless you fill its slot. */
export const ShareDialogTrigger = withDefault(
  parts.Trigger,
  "ShareDialogTrigger",
  ({ state }: { state: { label: string } }) => state.label,
);

/** Dims the page behind the dialog. */
export const ShareDialogBackdrop = parts.Backdrop;

/** The dialog's title, the `dialogLabel`, unless you fill its slot. */
export const ShareDialogTitle = withDefault(
  parts.Title,
  "ShareDialogTitle",
  ({ state }: { state: { label: string } }) => state.label,
);

/** Who can open the chat, in words, unless you fill its slot. Describes the dialog. */
export const ShareDialogDescription = withDefault(
  parts.Description,
  "ShareDialogDescription",
  ({ state }: { state: { text: string } }) => state.text,
);

/** "Only you" or "Anyone with the link", a UI SDK Segmented Control, unless you fill its slot. */
export const ShareDialogVisibility = withDefault(
  parts.Visibility,
  "ShareDialogVisibility",
  ({ state }: { state: ShareDialogVisibilityState }) =>
    // Hidden from agents, which use the Share Dialog's own `setVisibility`.
    h(
      KindSegmentedControl,
      {
        controller: state.controller,
        defaultValue: state.defaultValue,
        "aria-label": state["aria-label"],
        "data-agent-hidden": "",
      },
      () => [
        h(KindSegmentedControlIndicator),
        ...state.options.map((option) =>
          h(KindSegmentedControlItem, { key: option.value, value: option.value }, () => option.label),
        ),
      ],
    ),
);

/** The `link`, in a read-only UI SDK Input, unless you fill its slot. */
export const ShareDialogLink = withDefault(
  parts.Link,
  "ShareDialogLink",
  ({ state }: { state: ShareDialogLinkState }) =>
    h(Input, {
      value: state.value,
      readOnly: state.readOnly,
      "aria-label": state["aria-label"],
      "data-agent-hidden": "",
    }),
);

const pendingLabel =
  (label: string, pending: string) =>
  ({ state }: { state: ShareDialogActionState }) =>
    state.pending
      ? [
          h("span", {
            "aria-hidden": "true",
            "data-status-mark": "",
            "data-status": "running",
            "data-motion": state.motion,
          }),
          pending,
        ]
      : label;

/** Calls `onCreateLink`. "Create link", or "Creating link" with a running mark while pending, unless you fill its slot. */
export const ShareDialogCreate = withDefault(
  parts.Create,
  "ShareDialogCreate",
  pendingLabel("Create link", "Creating link"),
);

/** Copies the `link`. "Copy link", then "Copied" for 2 s, unless you fill its slot. */
export const ShareDialogCopy = withDefault(
  parts.Copy,
  "ShareDialogCopy",
  ({ state }: { state: { copied: boolean } }) => (state.copied ? "Copied" : "Copy link"),
);

/** Calls `onRevoke`. "Stop sharing", or "Stopping" with a running mark while pending, unless you fill its slot. */
export const ShareDialogRevoke = withDefault(
  parts.Revoke,
  "ShareDialogRevoke",
  pendingLabel("Stop sharing", "Stopping"),
);

/** Why the last create or revoke failed, unless you fill its slot. */
export const ShareDialogError = withDefault(
  parts.Error,
  "ShareDialogError",
  ({ state }: { state: { message: string } }) => state.message,
);

/** Closes the dialog and returns focus to the trigger. "Done", unless you fill its slot. */
export const ShareDialogClose = withDefault(parts.Close, "ShareDialogClose", () => "Done");

const DEFAULT_PANEL = () => [
  h("div", { "data-share-dialog-header": "" }, [h(ShareDialogTitle), h(ShareDialogDescription)]),
  h(ShareDialogVisibility),
  h("div", { "data-share-dialog-link-row": "" }, [
    h(ShareDialogCreate),
    h(ShareDialogLink),
    h(ShareDialogCopy),
  ]),
  h("div", { "data-share-dialog-footer": "" }, [
    h(ShareDialogError),
    h(ShareDialogRevoke),
    h(ShareDialogClose),
  ]),
];

/** The dialog: its title, who can open the chat, the link and its actions, unless you fill its slot. */
export const ShareDialogContent = defineComponent({
  name: "ShareDialogContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Content, attrs, {
        default: slots.default ?? DEFAULT_PANEL,
        // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
        render: (scope: {
          props: Record<string, unknown>;
          state: { presentation: string };
          children: Component;
        }) => {
          const element = slots.render ? slots.render(scope) : h("div", scope.props, [h(scope.children)]);
          return [scope.state.presentation === "sheet" ? h(parts.Viewport, null, () => element) : element];
        },
      });
  },
}) as unknown as typeof parts.Content;

/**
 * A Share button whose dialog chooses who can open the chat and shows the link the host makes, with Copy link and
 * Stop sharing. A default slot replaces the trigger and the dialog.
 */
export const ShareDialog = withDefault(parts.Root, "ShareDialog", () => [
  h(ShareDialogTrigger),
  h(ShareDialogBackdrop),
  h(ShareDialogContent),
]);
