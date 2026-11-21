import {
  APPROVAL_MODE_GROUP,
  APPROVAL_MODE_LEARN_MORE,
  type ApprovalModeContentState,
  type ApprovalModeRow,
  type ApprovalModeTriggerState,
  approvalModePrimitive,
} from "@kind-ui/agent-ui/core";
import { MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type PropType, type SlotsType } from "vue";
import {
  KindMenu,
  KindMenuContent,
  KindMenuGroupLabel,
  KindMenuItem,
  KindMenuItemContent,
  KindMenuItemIndicator,
  KindMenuRadioGroup,
  KindMenuRadioItem,
  KindMenuSeparator,
  menuProps,
  menuTriggerProps,
} from "./internal/menu.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onLearnMore`, whose presence offers Learn more, is declared a function prop instead, which `@learn-more` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => approvalModePrimitive(options), approvalModePrimitive, {
    options: { ...approvalModePrimitive.options, onLearnMore: "action" },
  }),
  "name",
  { value: approvalModePrimitive.name },
) as typeof approvalModePrimitive;

const parts = createParts(primitive, { root: "div", trigger: "span", content: "div" });

const risky = () => h("span", { "data-approval-mode-risk": "" }, "Risky");

/** The modes' radio items, a risky one marked "Risky". Choosing one closes the menu. */
export const ApprovalModeRows = defineComponent({
  name: "ApprovalModeRows",
  props: { rows: { type: Array as PropType<ApprovalModeRow[]>, required: true } },
  setup(props) {
    return () =>
      props.rows.map((row) =>
        h(
          KindMenuRadioItem,
          {
            key: row.value,
            value: row.value,
            label: row.label,
            closeOnSelect: true,
            "data-danger": row.danger ? "" : undefined,
          },
          () => [
            h(KindMenuItemIndicator, { keepMounted: true }, () =>
              h("span", { "data-menu-check": "", "aria-hidden": "true" }),
            ),
            h(KindMenuItemContent, { label: row.label, description: row.description }),
            row.danger ? risky() : null,
          ],
        ),
      );
  },
});

const triggerValue = (mode: ApprovalModeRow | undefined) => [
  h("span", { "data-menu-trigger-icon": "", "aria-hidden": "true" }),
  mode ? h("span", { "data-approval-mode-value": "" }, mode.label) : null,
  mode?.danger
    ? h("span", { "data-status-mark": "", "data-status": "warning", "aria-hidden": "true" })
    : null,
];

/**
 * Opens the menu: UI SDK's `MenuTrigger`, named by the `label` and the mode. A default slot, which gets the trigger's
 * state, replaces a shield, the mode's label and a risky mode's mark. Attributes go to it.
 */
export const ApprovalModeTrigger = defineComponent({
  name: "ApprovalModeTrigger",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: ApprovalModeTriggerState }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Trigger, null, {
        default: ({ state }: { state: ApprovalModeTriggerState }) => {
          const trigger = menuTriggerProps(state);
          const mode = state.mode;
          // Hidden from agents, which use the Approval Mode's own actions.
          return h(
            MenuTrigger,
            { ...trigger, "data-agent-hidden": "", ...attrs },
            { default: () => (slots.default ? slots.default({ ...trigger, mode }) : triggerValue(mode)) },
          );
        },
      });
  },
});

/**
 * The menu: UI SDK's `MenuContent` holding one radio group, headed by the `label`, of the modes unless you pass a slot,
 * which gets the content's state, then a Learn more item (a link with `learnMoreHref`). Attributes go to the content.
 */
export const ApprovalModeContent = defineComponent({
  name: "ApprovalModeContent",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: ApprovalModeContentState }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Content, null, {
        default: ({ state }: { state: ApprovalModeContentState }) => {
          const content: ApprovalModeContentState = {
            label: state.label,
            learnMore: state.learnMore,
            learnMoreHref: state.learnMoreHref,
            rows: state.rows,
            value: state.value,
          };
          const href = content.learnMoreHref;
          return h(KindMenuContent, { align: "start", sideOffset: 6, ...attrs }, () => [
            h(KindMenuRadioGroup, { name: APPROVAL_MODE_GROUP, value: content.value }, () => [
              h("div", { "data-approval-mode-header": "" }, [
                h(KindMenuGroupLabel, null, () => content.label),
              ]),
              slots.default ? slots.default(content) : h(ApprovalModeRows, { rows: content.rows }),
            ]),
            content.learnMore
              ? [
                  h(KindMenuSeparator, { "data-approval-mode-learn-more": "" }),
                  h(
                    KindMenuItem,
                    {
                      value: APPROVAL_MODE_LEARN_MORE,
                      "data-approval-mode-learn-more": "",
                      "data-menu-inset": "",
                    },
                    {
                      default: () => "Learn more",
                      ...(href && {
                        render: ({
                          props,
                          children,
                        }: {
                          props: Record<string, unknown>;
                          children: Component;
                        }) => h("a", { ...props, href }, [h(children)]),
                      }),
                    },
                  ),
                ]
              : null,
          ]);
        },
      });
  },
});

const defaultParts = () => [h(ApprovalModeTrigger), h(ApprovalModeContent)];

/**
 * A button showing the approval mode, named "Approvals, <mode>", that opens a menu of modes: radio items with a
 * description each, a risky one marked, and an optional Learn more link after them. A default slot replaces the
 * trigger and the content, inside UI SDK Menu.
 */
export const ApprovalMode = defineComponent({
  name: "ApprovalMode",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        default: ({ state }: { state: Parameters<typeof menuProps>[0] }) =>
          h(KindMenu, menuProps(state), { default: slots.default ?? defaultParts }),
      });
  },
}) as unknown as typeof parts.Root;
