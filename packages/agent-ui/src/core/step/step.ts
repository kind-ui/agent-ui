import {
  announce,
  bindPanel,
  type ChangeDetails,
  createChange,
  css,
  definePrimitive,
  hiddenAttrs,
  openAttrs,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import type { MotionMode } from "../motion/index.js";
import { nextOpen, type StepAutoOpen } from "./auto-open.js";

export type StepOpenChangeReason = "trigger-press" | "find-in-page" | "imperative" | "auto";

export type StepOptions = {
  /** Defaults to `"pending"`. */
  status?: StepStatus;
  /** Written as `data-kind`, for styling by step type. */
  kind?: string;
  /** Names the step in announcements. Defaults to the title part's text. */
  title?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: ChangeDetails<StepOpenChangeReason>) => void;
  /** Defaults to `"running"`: opens while running or awaiting input, closes on completion unless toggled. */
  autoOpen?: StepAutoOpen;
  /** Written as `--kind-step-duration`. */
  durationSeconds?: number;
  /** Defaults to `"auto"`, which follows `prefers-reduced-motion`. */
  motion?: MotionMode;
};

export type StepState = {
  open: boolean;
  status: StepStatus;
  kind: string | undefined;
  durationSeconds: number | undefined;
  motion: MotionMode;
  userToggled: boolean;
  exiting: boolean;
};

type Cause = { reason?: StepOpenChangeReason; event?: Event | undefined };

export type StepApi = {
  setOpen: (open: boolean, cause?: Cause) => boolean;
  expand: () => boolean;
  collapse: () => boolean;
  toggle: (event?: Event) => boolean;
};

type StepSlot = SlotDefinition<StepState, StepApi, BaseSlotProps, Record<never, never>>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StepPrimitive = ReturnType<
  typeof definePrimitive<
    StepOptions,
    StepState,
    StepApi,
    Record<"root" | "trigger" | "icon" | "title" | "meta" | "content" | "children", StepSlot>
  >
>;

const ANNOUNCED: Partial<Record<StepStatus, string>> = {
  "awaiting-input": "needs input",
  complete: "complete",
  error: "failed",
  cancelled: "cancelled",
};

const autoOpened = (options: StepOptions): boolean =>
  options.autoOpen !== "never" && (options.status === "running" || options.status === "awaiting-input");

const presentation = (options: StepOptions) => ({
  status: options.status ?? "pending",
  kind: options.kind,
  durationSeconds: options.durationSeconds,
  motion: options.motion ?? "auto",
});

export const stepPrimitive: StepPrimitive = definePrimitive({
  name: "kind-step",
  options: {
    status: "string",
    kind: "string",
    title: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    autoOpen: "string",
    durationSeconds: "number",
    motion: "string",
  },
  state: (options: StepOptions): StepState => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? autoOpened(options),
    userToggled: false,
    exiting: false,
  }),
  sync: (options: StepOptions) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open", "status"],
  api: (context): StepApi => {
    const change = createChange(context);
    let prevStatus = context.store.get().status;
    let wasOpen = context.store.get().open;

    const setOpen = (open: boolean, { reason = "imperative", event }: Cause = {}) => {
      const auto = reason === "auto";
      const changed = change(
        "open",
        open,
        auto ? { reason, source: "programmatic" } : event ? { reason, event } : { reason },
      );
      if (changed && !auto) context.store.set({ userToggled: true });
      return changed;
    };

    context.store.subscribe(() => {
      const { open } = context.store.get();
      if (open === wasOpen) return;
      wasOpen = open;
      if (!open) context.store.set({ exiting: true });
    });

    context.onOptions((options) => {
      const status = options.status ?? "pending";
      if (status === prevStatus) return;
      const { open, userToggled } = context.store.get();
      const next = nextOpen({
        status,
        prevStatus,
        open,
        userToggled,
        autoOpen: options.autoOpen ?? "running",
      });
      prevStatus = status;
      if (next !== open) setOpen(next, { reason: "auto" });
      const outcome = ANNOUNCED[status];
      const title = options.title ?? context.element("title")?.textContent?.trim();
      if (outcome && title) announce(`${title} ${outcome}`, { priority: "polite" });
    });

    return {
      setOpen,
      expand: () => setOpen(true),
      collapse: () => setOpen(false),
      toggle: (event?: Event) => setOpen(!context.store.get().open, { reason: "trigger-press", event }),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state, part) => ({
        "aria-labelledby": `${part.id}-title`,
        "data-status": state.status,
        "data-kind": state.kind,
        ...openAttrs(state.open),
        style: css({
          "--kind-step-duration":
            state.durationSeconds === undefined ? undefined : `${state.durationSeconds}s`,
        }),
      }),
    }),
    trigger: slot({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.toggle(event),
      attrs: (state, part) => ({
        type: "button",
        "aria-expanded": String(state.open),
        "aria-controls": `${part.id}-content`,
        "data-status": state.status,
        "data-motion": state.motion,
        ...openAttrs(state.open),
      }),
    }),
    icon: slot({
      attrs: (state) => ({ "aria-hidden": "true", "data-status": state.status, "data-motion": state.motion }),
    }),
    title: slot({
      attrs: (state, part) => ({
        id: `${part.id}-title`,
        "data-status": state.status,
        "data-motion": state.motion,
      }),
    }),
    meta: slot({
      attrs: (state) => ({ "data-status": state.status }),
    }),
    content: slot({
      attrs: (state, part) => ({
        id: `${part.id}-content`,
        "data-status": state.status,
        "data-motion": state.motion,
        ...openAttrs(state.open),
        ...hiddenAttrs(state.open || state.exiting, true),
      }),
      bind: (el, { api, id, store }) => {
        let opening: "mount" | "instant" | "animate" = store.get().open ? "mount" : "animate";
        return bindPanel(el, {
          size: (panel, height) => panel.style.setProperty("--kind-step-content-height", height),
          isOpen: () => store.get().open,
          isExiting: () => store.get().exiting,
          isFindable: () => true,
          opening: () => {
            const current = store.get().motion === "none" ? "instant" : opening;
            opening = "animate";
            return current;
          },
          reveal: (event) => {
            opening = "instant";
            api.setOpen(true, { reason: "find-in-page", event });
          },
          trigger: () =>
            el.ownerDocument.querySelector<HTMLElement>(`[aria-controls="${id}-content"]`) ?? undefined,
          subscribe: store.subscribe,
          settled: () => {},
          exited: () => store.set({ exiting: false }),
        });
      },
    }),
    children: slot({}),
  }),
  agent: { actions: ["expand", "collapse"] },
});
