import {
  APPROVAL_MODE_GROUP,
  APPROVAL_MODE_LEARN_MORE,
  type ApprovalModeContentState,
  type ApprovalModeRow,
  type ApprovalModeTriggerState,
  approvalModePrimitive,
  type MenuPartState,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import {
  childrenOr,
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

const parts = createParts(approvalModePrimitive, { root: "div", trigger: "span", content: "div" });

export type ApprovalModeProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

/**
 * A button showing the approval mode, named "Approvals, <mode>", that opens a menu of modes: radio items with a
 * description each, a risky one marked, and an optional Learn more link after them. Any `children` replace the
 * trigger and the content, inside UI SDK Menu.
 */
export function ApprovalMode(props: ApprovalModeProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(menu: MenuPartState) => (
        <KindMenu {...menuProps(menu)}>{props.children ?? <DefaultParts />}</KindMenu>
      )}
    </parts.Root>
  );
}

export type ApprovalModeRowsProps = Pick<ApprovalModeContentState, "rows">;

/** The modes' radio items, a risky one marked "Risky". Choosing one closes the menu. */
export function ApprovalModeRows(props: ApprovalModeRowsProps) {
  return (
    <For each={props.rows} keyed={(row) => row.value}>
      {(row) => (
        <KindMenuRadioItem
          value={row().value}
          label={row().label}
          closeOnSelect
          data-danger={row().danger ? "" : undefined}
        >
          <KindMenuItemIndicator keepMounted>
            <span data-menu-check="" aria-hidden="true" />
          </KindMenuItemIndicator>
          <KindMenuItemContent label={row().label} description={row().description} />
          <Show when={row().danger}>
            <span data-approval-mode-risk="">Risky</span>
          </Show>
        </KindMenuRadioItem>
      )}
    </For>
  );
}

function TriggerValue(props: { mode: ApprovalModeRow | undefined }) {
  return (
    <>
      <span data-menu-trigger-icon="" aria-hidden="true" />
      <Show when={props.mode}>{(mode) => <span data-approval-mode-value="">{mode().label}</span>}</Show>
      <Show when={props.mode?.danger}>
        <span data-status-mark="" data-status="warning" aria-hidden="true" />
      </Show>
    </>
  );
}

export type ApprovalModeTriggerProps = Omit<ComponentProps<typeof MenuTrigger>, "children"> & {
  /** What the button shows, or a function of its state: a shield, the mode's label and a risky mode's mark. */
  children?: JSX.Element | ((state: ApprovalModeTriggerState) => JSX.Element);
};

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label` and the mode. Props go to it. */
export function ApprovalModeTrigger(props: ApprovalModeTriggerProps) {
  return (
    <parts.Trigger>
      {(trigger: ApprovalModeTriggerState) => (
        // Hidden from agents, which use the Approval Mode's own actions.
        <MenuTrigger {...menuTriggerProps(trigger)} data-agent-hidden="" {...omit(props, "children")}>
          {childrenOr(props.children, trigger, () => (
            <TriggerValue mode={trigger.mode} />
          ))}
        </MenuTrigger>
      )}
    </parts.Trigger>
  );
}

export type ApprovalModeContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the radio group holds after its header, or a function of the content's state: the modes by default. */
  children?: JSX.Element | ((state: ApprovalModeContentState) => JSX.Element);
};

/**
 * The menu: UI SDK's `MenuContent` holding one radio group, headed by the `label`, of the modes unless you pass
 * children, then a Learn more item (a link with `learnMoreHref`). Props go to the content.
 */
export function ApprovalModeContent(props: ApprovalModeContentProps) {
  return (
    <parts.Content>
      {(state: ApprovalModeContentState) => (
        <KindMenuContent align="start" sideOffset={6} {...omit(props, "children")}>
          <KindMenuRadioGroup name={APPROVAL_MODE_GROUP} value={state.value}>
            <div data-approval-mode-header="">
              <KindMenuGroupLabel>{state.label}</KindMenuGroupLabel>
            </div>
            {childrenOr(props.children, state, () => (
              <ApprovalModeRows rows={state.rows} />
            ))}
          </KindMenuRadioGroup>
          <Show when={state.learnMore}>
            <KindMenuSeparator data-approval-mode-learn-more="" />
            <KindMenuItem
              value={APPROVAL_MODE_LEARN_MORE}
              data-approval-mode-learn-more=""
              data-menu-inset=""
              // UI SDK reads `render` once, so the element follows `learnMoreHref` inside it.
              render={(itemProps: JSX.HTMLAttributes<HTMLDivElement>) => (
                <Show when={state.learnMoreHref} fallback={<div {...itemProps} />}>
                  {(href) => (
                    <a
                      {...(itemProps as JSX.AnchorHTMLAttributes<HTMLAnchorElement> &
                        JSX.HTMLAttributes<HTMLDivElement>)}
                      href={href()}
                    />
                  )}
                </Show>
              )}
            >
              Learn more
            </KindMenuItem>
          </Show>
        </KindMenuContent>
      )}
    </parts.Content>
  );
}

const DefaultParts = () => (
  <>
    <ApprovalModeTrigger />
    <ApprovalModeContent />
  </>
);
