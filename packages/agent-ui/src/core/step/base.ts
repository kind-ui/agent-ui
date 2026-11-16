import {
  announce,
  bindPanel,
  type ChangeDetails,
  createChange,
  css,
  hiddenAttrs,
  openAttrs,
  type PrimitiveContext,
  type SlotFactory,
} from "@ui-sdk/core";
import type { StepStatus } from "../../types/index.js";
import type { MotionMode } from "../motion/index.js";
import { nextOpen, type StepAutoOpen } from "./auto-open.js";

export type StepOpenChangeReason = "trigger-press" | "find-in-page" | "imperative" | "auto";

export type StepOptions = {
  /**
   * What the step is doing. The icon shows it.
   * @default "pending"
   */
  status?: StepStatus;
  /** Written as `data-kind`, for styling by step type. */
  kind?: string;
  /** Names the step in announcements. Defaults to the title part's text. */
  label?: string;
  /** Whether the content shows. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the content shows at first, when `open` isn't passed. Defaults to open while `status` is `running` or
   * `awaiting-input`, unless `autoOpen` is `"never"`.
   */
  defaultOpen?: boolean;
  /** Called when the step opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<StepOpenChangeReason>) => void;
  /**
   * With `"running"`, the step opens while running or awaiting input and closes on completion, until someone
   * toggles it. With `"never"`, only a person or your code opens it.
   * @default "running"
   */
  autoOpen?: StepAutoOpen;
  /** Written as `--kind-step-duration`. */
  durationSeconds?: number;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
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
  /** The current open state; the owner's `open` when controlled. */
  isOpen: () => boolean;
  /** Opens or closes the step. Returns whether the change was accepted. */
  setOpen: (open: boolean, cause?: Cause) => boolean;
  /** Opens the step. Returns whether the change was accepted. */
  expand: () => boolean;
  /** Closes the step. Returns whether the change was accepted. */
  collapse: () => boolean;
  /** Opens a closed step and closes an open one, as the trigger does. Returns whether the change was accepted. */
  toggle: (event?: Event) => boolean;
};

export type StepBaseConfig<State extends StepState = StepState, Options extends StepOptions = StepOptions> = {
  /** `data-kind` when the host passes no `kind`. */
  kind?: string;
  /** The status when the host passes no `status`, like one read from the component's own data. Else `"pending"`. */
  status?: (options: Options) => StepStatus;
  /**
   * Replaces `stepAnnouncement`, with the state the new options make. Called on a status change, once the step has
   * a title (`label` or the title part's text). Returning `undefined` keeps the step quiet.
   */
  announcement?: (status: StepStatus, title: string, state: State) => string | undefined;
};

const OUTCOMES: Partial<Record<StepStatus, string>> = {
  "awaiting-input": "needs input",
  complete: "complete",
  error: "failed",
  cancelled: "cancelled",
};

/** What a step announces when it reaches `status`, or `undefined` for a status that isn't announced. */
export const stepAnnouncement = (status: StepStatus, title: string): string | undefined => {
  const outcome = OUTCOMES[status];
  return outcome && `${title} ${outcome}`;
};

export type StepPanelOptions = {
  isOpen(): boolean;
  /** Whether the panel is closing and still shown while its exit plays. */
  isExiting(): boolean;
  motion(): MotionMode;
  /** Find in page matched hidden text: open the panel. */
  reveal(event: Event): void;
  /** The button that controls the panel, where focus goes when it closes with focus inside. */
  trigger(): HTMLElement | undefined;
  /** Calls `listener` whenever the open, exiting or motion state may have changed. */
  subscribe(listener: () => void): () => void;
  /** Called once the panel has finished closing: after its exit, or at once without one. */
  exited(): void;
};

/**
 * A step's collapsible content: findable while closed, and sized through `--kind-step-content-height`, which
 * `step.css` animates. It opens without animating when it mounts open, under `motion="none"`, or for find in page.
 */
export const bindStepPanel = (el: HTMLElement, options: StepPanelOptions): (() => void) => {
  let opening: "mount" | "instant" | "animate" = options.isOpen() ? "mount" : "animate";
  return bindPanel(el, {
    size: (panel, height) => panel.style.setProperty("--kind-step-content-height", height),
    isOpen: options.isOpen,
    isExiting: options.isExiting,
    isFindable: () => true,
    opening: () => {
      const current = options.motion() === "none" ? "instant" : opening;
      opening = "animate";
      return current;
    },
    reveal: (event) => {
      opening = "instant";
      options.reveal(event);
    },
    trigger: options.trigger,
    subscribe: options.subscribe,
    settled: () => {},
    exited: options.exited,
  });
};

/**
 * Everything but the name of Step and every Step-based component (spec §5): options, state, the api, the seven
 * slots and the agent actions, each spread into the component's own `definePrimitive`. A component with its own
 * state overrides `state` and `sync`, spreading `base.state(options)` and `base.sync(options)` into them.
 */
export const stepBase = <
  State extends StepState = StepState,
  Api extends StepApi = StepApi,
  Options extends StepOptions = StepOptions,
>({
  kind,
  announcement = stepAnnouncement,
  status: defaultStatus = () => "pending",
}: StepBaseConfig<State, Options> = {}) => {
  const statusOf = (options: Options) => options.status ?? defaultStatus(options);
  const presentation = (options: Options) => ({
    status: statusOf(options),
    kind: options.kind ?? kind,
    durationSeconds: options.durationSeconds,
    motion: options.motion ?? "auto",
  });
  return {
    options: {
      status: "string",
      kind: "string",
      label: "string",
      open: "boolean",
      defaultOpen: "boolean",
      onOpenChange: "callback",
      autoOpen: "string",
      durationSeconds: "number",
      motion: "string",
    } as const,
    state: (options: Options): StepState => {
      const status = statusOf(options);
      const autoOpened =
        options.autoOpen !== "never" && (status === "running" || status === "awaiting-input");
      return {
        ...presentation(options),
        open: options.open ?? options.defaultOpen ?? autoOpened,
        userToggled: false,
        exiting: false,
      };
    },
    // Typed on `State`, so a component's own `sync` can spread it.
    sync: (options: Options) =>
      ({
        ...presentation(options),
        ...(options.open === undefined ? {} : { open: options.open }),
      }) as Partial<State>,
    controlled: ["open", "status"] as ("open" | "status")[],
    api: (context: PrimitiveContext<Options, StepState, string>): StepApi => {
      // `createChange` reads open change reasons from the options type, which a generic `Options` hides.
      const change = createChange(context as PrimitiveContext<StepOptions, StepState, string>);
      let prevStatus = context.store.get().status;
      let wasOpen = context.store.get().open;

      const setOpen = (open: boolean, { reason = "imperative", event }: Cause = {}) => {
        const auto = reason === "auto";
        const changed = change(
          "open",
          open,
          auto ? { reason, source: "programmatic" } : event ? { reason, event } : { reason },
        );
        // Spec §5: only a person or agent toggling stops auto behavior, not a host write.
        if (changed && !auto && reason !== "imperative") context.store.set({ userToggled: true });
        return changed;
      };
      const toggledBy = (changed: boolean) => {
        if (changed) context.store.set({ userToggled: true });
        return changed;
      };

      context.store.subscribe(() => {
        const { open } = context.store.get();
        if (open === wasOpen) return;
        wasOpen = open;
        if (!open) context.store.set({ exiting: true });
      });

      context.onOptions((options, synced) => {
        const status = statusOf(options);
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
        const title = options.label ?? context.element("title")?.textContent?.trim();
        // The store takes `synced` after the listeners run, so state computed from the new options is read from it.
        const text = title && announcement(status, title, { ...context.store.get(), ...synced } as State);
        if (text) announce(text, { priority: "polite" });
      });

      return {
        isOpen: () => context.store.get().open,
        setOpen,
        expand: () => toggledBy(setOpen(true)),
        collapse: () => toggledBy(setOpen(false)),
        toggle: (event?: Event) => setOpen(!context.store.get().open, { reason: "trigger-press", event }),
      };
    },
    slots: (slot: SlotFactory<State, Api>) => ({
      root: slot({
        role: "group",
        attrs: (state, part) => ({
          "aria-labelledby": `${part.id}-title`,
          "data-step-part": "root",
          "data-status": state.status,
          "data-kind": state.kind,
          ...openAttrs(state.open),
          style: css({
            "--kind-step-duration":
              state.durationSeconds === undefined ? undefined : `${state.durationSeconds}s`,
          }),
        }),
        // Web parts get their attributes as each connects, and a style read while they connect (UI SDK's panel and
        // Scroll Area measure as they bind) sees the later ones bare, so their colors would fade in from the
        // browser's. `step.css` holds transitions while `data-mounting` is on, through the first frame's style pass.
        bind: (el) => {
          el.setAttribute("data-mounting", "");
          let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => el.removeAttribute("data-mounting"));
          });
          return () => {
            cancelAnimationFrame(frame);
            el.removeAttribute("data-mounting");
          };
        },
      }),
      trigger: slot({
        role: "button",
        focus: "native",
        press: ({ api }, event) => api.toggle(event),
        attrs: (state, part) => ({
          type: "button",
          "aria-expanded": String(state.open),
          "aria-controls": `${part.id}-content`,
          "data-step-part": "trigger",
          "data-status": state.status,
          "data-motion": state.motion,
          ...openAttrs(state.open),
        }),
      }),
      icon: slot({
        attrs: (state) => ({
          "aria-hidden": "true",
          "data-step-part": "icon",
          "data-status-mark": "",
          "data-status": state.status,
          "data-motion": state.motion,
        }),
      }),
      title: slot({
        attrs: (state, part) => ({
          id: `${part.id}-title`,
          "data-step-part": "title",
          "data-status": state.status,
          "data-motion": state.motion,
        }),
      }),
      meta: slot({
        attrs: (state) => ({ "data-step-part": "meta", "data-status": state.status }),
      }),
      content: slot({
        attrs: (state, part) => ({
          id: `${part.id}-content`,
          "data-step-part": "content",
          "data-status": state.status,
          "data-motion": state.motion,
          ...openAttrs(state.open),
          ...hiddenAttrs(state.open || state.exiting, true),
        }),
        bind: (el, { api, id, store }) =>
          bindStepPanel(el, {
            isOpen: () => store.get().open,
            isExiting: () => store.get().exiting,
            motion: () => store.get().motion,
            reveal: (event) => api.setOpen(true, { reason: "find-in-page", event }),
            trigger: () =>
              el.ownerDocument.querySelector<HTMLElement>(`[aria-controls="${id}-content"]`) ?? undefined,
            subscribe: store.subscribe,
            // TypeScript can't relate a StepState key to a `State` that only extends it.
            exited: () => store.set({ exiting: false } as Partial<State>),
          }),
      }),
      children: slot({ attrs: () => ({ "data-step-part": "children" }) }),
    }),
    agent: { actions: ["expand", "collapse"] },
  };
};
