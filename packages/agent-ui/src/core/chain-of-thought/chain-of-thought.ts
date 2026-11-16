import {
  announce,
  type ChangeDetails,
  createChange,
  css,
  definePrimitive,
  hiddenAttrs,
  idPart,
  live,
  openAttrs,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { memo } from "../memo.js";
import { enter } from "../motion/index.js";
import {
  bindStepPanel,
  holdTransitions,
  type StepApi,
  type StepOpenChangeReason,
  type StepOptions,
  type StepState,
  stepAnnouncement,
  stepBase,
} from "../step/base.js";
import { type ChainOfThoughtStep, nextOpenSteps, stepDuration } from "./open-steps.js";

export type ChainOfThoughtOptions = Omit<StepOptions, "label"> & {
  /** The steps the agent took, in order. Update a step's `status` as it runs, keeping its `id`. Defaults to none. */
  steps?: ChainOfThoughtStep[];
  /** The summary the title shows, else "N steps". Also names the chain in announcements. */
  label?: string;
  /** The ids of the open steps. Passing it controls it: change it in `onOpenStepsChange`. */
  openSteps?: string[];
  /**
   * The open steps at first, when `openSteps` isn't passed. Defaults to the steps running or awaiting input, unless
   * `autoOpen` is `"never"`.
   */
  defaultOpenSteps?: string[];
  /** Called when a step opens or closes, with every open step's id and what caused it. */
  onOpenStepsChange?: (openSteps: string[], details: ChangeDetails<StepOpenChangeReason>) => void;
};

export type ChainOfThoughtState = StepState & {
  /** The `label`, else "N steps". */
  title: string;
  /** The `steps` option, which the list renders in order. */
  steps: ChainOfThoughtStep[];
  /** The steps by id, so a step's update reaches only its own parts. */
  stepsById: Record<string, ChainOfThoughtStep>;
  /** The ids of the open steps. */
  openSteps: string[];
  /** Steps whose content is closing and still shown while its exit plays. */
  exitingSteps: string[];
  /** Steps with content in the page, which their triggers point at. */
  panels: string[];
  /** The step trigger that holds the list's Tab stop. */
  focused: string | null;
};

type Cause = { reason?: StepOpenChangeReason; event?: Event | undefined };

type ItemProps = { value: string };
/** A part inside an item, which takes the item's `value`. */
type ItemPartProps = { value?: string };

export type ChainOfThoughtApi = StepApi &
  ListFocus<ChainOfThoughtState, ItemPartProps> & {
    /** The `steps` option. */
    getSteps: () => ChainOfThoughtStep[];
    /** The ids of the open steps; the owner's `openSteps` when controlled. */
    getOpenSteps: () => string[];
    /** Opens exactly these steps, without stopping their auto open and close. Returns whether the change was accepted. */
    setOpenSteps: (openSteps: string[], cause?: Cause) => boolean;
    /** Whether the step with this id is open. */
    isStepOpen: (id: string) => boolean;
    /** Opens or closes one step. Returns `false` for an unknown step, else whether the change was accepted. */
    setStepOpen: (id: string, open: boolean, cause?: Cause) => boolean;
    /**
     * Opens one step, which then stays open when it completes. Returns `false` for an unknown or open step, else
     * whether the change was accepted.
     */
    expandStep: (id: string) => boolean;
    /** Plays a step's entrance when it arrives after the first frame. Called by the item slot. */
    bindStep: (el: HTMLElement, id: string) => void;
    /** Makes a step's content a collapsible panel. Called by the item content slot. */
    bindStepContent: (el: HTMLElement, id: string) => () => void;
    /** Starts counting steps as new after the first frame. Called by the root slot. */
    bindRoot: () => () => void;
  };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ChainOfThoughtState, ChainOfThoughtApi, Props, Public>;

type ItemSlot<Public extends object = Record<never, never>> = Slot<ItemPartProps & BaseSlotProps, Public>;

type ChainOfThoughtSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<BaseSlotProps, { title: string }>;
  meta: Slot<BaseSlotProps, { duration: string }>;
  content: Slot;
  list: Slot<BaseSlotProps, { steps: ChainOfThoughtStep[] }>;
  item: Slot<ItemProps & BaseSlotProps, { status: StepStatus; open: boolean }>;
  "item-trigger": ItemSlot<{ open: boolean }>;
  "item-icon": ItemSlot;
  "item-title": ItemSlot<{ title: string }>;
  "item-meta": ItemSlot<{ duration: string }>;
  "item-content": ItemSlot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ChainOfThoughtPrimitive = ReturnType<
  typeof definePrimitive<ChainOfThoughtOptions, ChainOfThoughtState, ChainOfThoughtApi, ChainOfThoughtSlots>
>;

const NO_STEPS: ChainOfThoughtStep[] = [];

const byId = memo((steps: ChainOfThoughtStep[]) => Object.fromEntries(steps.map((step) => [step.id, step])));

const presentation = ({ steps = NO_STEPS, label }: ChainOfThoughtOptions) => ({
  title: label ?? `${steps.length} ${steps.length === 1 ? "step" : "steps"}`,
  steps,
  stepsById: byId(steps),
});

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

// The chain announces its own status with its steps' (see `api`), so the messages of one update don't replace each other.
const base = stepBase<ChainOfThoughtState, ChainOfThoughtApi, ChainOfThoughtOptions>({
  kind: "chain-of-thought",
  announcement: () => undefined,
});

// A step's parts hear only about their own step: its entry, and whether it's open or closing.
const ownStep = selects<ChainOfThoughtState, ChainOfThoughtApi, ItemPartProps>({
  stepsById: ({ key }) => [key],
  openSteps: ({ key }) => [key],
  exitingSteps: ({ key }) => [key],
  steps: [],
  title: [],
});

const fromItem = { value: { kind: "string", from: "item" } } as const;

export const chainOfThoughtPrimitive: ChainOfThoughtPrimitive = definePrimitive<
  ChainOfThoughtOptions,
  ChainOfThoughtState,
  ChainOfThoughtApi,
  ChainOfThoughtSlots
>({
  name: "kind-chain-of-thought",
  ...base,
  options: {
    ...base.options,
    steps: "value",
    openSteps: "list",
    defaultOpenSteps: "list",
    onOpenStepsChange: "callback",
  },
  state: (options) => {
    const { steps } = presentation(options);
    const running = steps
      .filter((step) => step.status === "running" || step.status === "awaiting-input")
      .map((step) => step.id);
    return {
      ...base.state(options),
      ...presentation(options),
      openSteps:
        options.openSteps ?? options.defaultOpenSteps ?? (options.autoOpen === "never" ? [] : running),
      exitingSteps: [],
      panels: [],
      focused: null,
    };
  },
  live: ["panels"],
  sync: (options) => ({
    ...base.sync(options),
    ...presentation(options),
    ...(options.openSteps === undefined ? {} : { openSteps: options.openSteps }),
  }),
  controlled: ["open", "status", "openSteps"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const toggled = new Set<string>();
    const panels = new Set<string>();
    let prevSteps = store.get().steps;
    let prevOpen = store.get().openSteps;
    let prevStatus = store.get().status;
    // Web hosts can only set `steps` once the element exists, so steps in the first frame count as known: they don't
    // play the entrance or announce.
    let mounting = true;
    const known = new Set(prevSteps.map((step) => step.id));

    const isStepOpen = (id: string) => store.get().openSteps.includes(id);
    const setOpenSteps = (openSteps: string[], { reason = "imperative", event }: Cause = {}) =>
      !sameIds(openSteps, store.get().openSteps) &&
      change(
        "openSteps",
        openSteps,
        reason === "auto" ? { reason, source: "programmatic" } : event ? { reason, event } : { reason },
      );
    const setStepOpen = (id: string, open: boolean, cause: Cause = {}) => {
      const { openSteps, stepsById } = store.get();
      if (!Object.hasOwn(stepsById, id) || openSteps.includes(id) === open) return false;
      const changed = setOpenSteps(
        open ? [...openSteps, id] : openSteps.filter((each) => each !== id),
        cause,
      );
      // Spec §5: only a person or agent toggling stops auto behavior, not a host write.
      if (changed && cause.reason !== undefined && cause.reason !== "auto" && cause.reason !== "imperative")
        toggled.add(id);
      return changed;
    };

    store.subscribe(() => {
      const { openSteps, exitingSteps } = store.get();
      if (openSteps === prevOpen) return;
      const closed = prevOpen.filter((id) => !openSteps.includes(id) && panels.has(id));
      prevOpen = openSteps;
      const exiting = [...exitingSteps.filter((id) => !openSteps.includes(id)), ...closed];
      if (!sameIds(exiting, exitingSteps)) store.set({ exitingSteps: exiting });
    });

    context.onOptions((options, synced) => {
      const texts: string[] = [];
      const steps = options.steps ?? NO_STEPS;
      if (steps !== prevSteps) {
        const next = nextOpenSteps({
          prev: prevSteps,
          next: steps,
          // The store takes `synced` after the listeners run, so a controlled `openSteps` is read from it.
          open: synced?.openSteps ?? store.get().openSteps,
          toggled: [...toggled],
          autoOpen: options.autoOpen ?? "running",
        });
        const statuses = new Map(prevSteps.map((step) => [step.id, step.status]));
        prevSteps = steps;
        for (const id of toggled) if (!steps.some((step) => step.id === id)) toggled.delete(id);
        setOpenSteps(next, { reason: "auto" });
        for (const { id, status, title } of steps) {
          if (mounting || !title || status === (statuses.get(id) ?? "pending")) continue;
          const text = stepAnnouncement(status, title);
          if (text) texts.push(text);
        }
      }
      const status = synced?.status ?? prevStatus;
      if (status !== prevStatus) {
        prevStatus = status;
        const title = options.label ?? context.element("title")?.textContent?.trim();
        const text = title && stepAnnouncement(status, title);
        if (text) texts.push(text);
      }
      // A polite announcement replaces one still waiting, so steps that end together are read as one.
      if (texts.length) announce(texts.join(". "), { priority: "polite" });
    });

    let syncQueued = false;
    const syncPanels = () => {
      if (syncQueued) return;
      syncQueued = true;
      queueMicrotask(() => {
        syncQueued = false;
        store.set({ panels: [...panels] });
      });
    };

    return {
      ...base.api(context),
      ...createListFocus<ChainOfThoughtState, ItemPartProps>(context, { slot: "item-trigger" }),
      getSteps: () => store.get().steps,
      getOpenSteps: () => store.get().openSteps,
      setOpenSteps,
      isStepOpen,
      setStepOpen,
      expandStep: (id) => {
        const changed = setStepOpen(id, true);
        if (changed) toggled.add(id);
        return changed;
      },
      bindStep: (el, id) => {
        if (known.has(id)) return;
        known.add(id);
        if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
      },
      bindStepContent: (el, id) => {
        panels.add(id);
        syncPanels();
        const unbind = bindStepPanel(el, {
          isOpen: () => isStepOpen(id),
          isExiting: () => store.get().exitingSteps.includes(id),
          motion: () => store.get().motion,
          reveal: (event) => setStepOpen(id, true, { reason: "find-in-page", event }),
          trigger: () => context.element("item-trigger", id),
          subscribe: store.subscribe,
          exited: () => store.set({ exitingSteps: store.get().exitingSteps.filter((each) => each !== id) }),
        });
        return () => {
          unbind();
          panels.delete(id);
          syncPanels();
          const { exitingSteps } = store.get();
          if (exitingSteps.includes(id))
            store.set({ exitingSteps: exitingSteps.filter((each) => each !== id) });
        };
      },
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, meta, content } = base.slots(slot);
    return {
      root: slot({
        ...root,
        bind: (el, part) => {
          const release = root.bind?.(el, part);
          const unbind = part.api.bindRoot();
          return () => {
            release?.();
            unbind();
          };
        },
      }),
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      meta: slot<BaseSlotProps, { duration: string }>({
        ...meta,
        state: (state) => ({ duration: stepDuration(state.durationSeconds) }),
      }),
      content,
      list: slot<BaseSlotProps, { steps: ChainOfThoughtStep[] }>({
        role: "list",
        attrs: () => ({ "data-step-part": "list" }),
        state: (state) => ({ steps: state.steps }),
      }),
      item: slot<ItemProps & BaseSlotProps, { status: StepStatus; open: boolean }>({
        role: "listitem",
        props: { value: "string" },
        selects: ownStep,
        state: (state, { key }) => ({
          status: state.stepsById[key]?.status ?? "pending",
          open: state.openSteps.includes(key),
        }),
        attrs: (state, { key }) => {
          const step = state.stepsById[key];
          return {
            "data-step-part": "root",
            "data-status": step?.status ?? "pending",
            ...openAttrs(state.openSteps.includes(key)),
            style: css({
              "--kind-step-duration":
                step?.durationSeconds === undefined ? undefined : `${step.durationSeconds}s`,
            }),
          };
        },
        bind: (el, { api, key }) => {
          api.bindStep(el, key);
          return holdTransitions(el);
        },
      }),
      "item-trigger": slot<ItemPartProps & BaseSlotProps, { open: boolean }>({
        role: "button",
        focus: "roving",
        props: fromItem,
        selects: ownStep,
        press: ({ api, key }, event) =>
          api.setStepOpen(key, !api.isStepOpen(key), { reason: "trigger-press", event }),
        state: (state, { key }) => ({ open: state.openSteps.includes(key) }),
        attrs: (state, part) => {
          const open = state.openSteps.includes(part.key);
          return {
            type: "button",
            tabindex: part.api.roving.tabIndex(state, part),
            "aria-expanded": String(open),
            "data-step-part": "trigger",
            "data-status": state.stepsById[part.key]?.status ?? "pending",
            "data-motion": state.motion,
            ...openAttrs(open),
          };
        },
        // Only content in the page can be pointed at.
        live: live((state, { id, key }) => ({
          "aria-controls": state.panels.includes(key) ? `${id}-step-${idPart(key)}` : undefined,
        })),
        on: {
          keydown: (event, { el, api }) => {
            if (el) api.roving.keydown(event as KeyboardEvent, el);
          },
        },
        bind: (el, part) => {
          const unbindFocus = part.api.roving.bind(el, part);
          const unbindRecovery = part.api.recovery.bind(el, part);
          return () => {
            unbindFocus();
            unbindRecovery();
          };
        },
      }),
      "item-icon": slot<ItemPartProps & BaseSlotProps>({
        props: fromItem,
        selects: ownStep,
        attrs: (state, { key }) => ({
          "aria-hidden": "true",
          "data-step-part": "icon",
          "data-status-mark": "",
          "data-status": state.stepsById[key]?.status ?? "pending",
          "data-motion": state.motion,
        }),
      }),
      "item-title": slot<ItemPartProps & BaseSlotProps, { title: string }>({
        props: fromItem,
        selects: ownStep,
        state: (state, { key }) => ({ title: state.stepsById[key]?.title ?? "" }),
        attrs: (state, { key }) => ({
          "data-step-part": "title",
          "data-status": state.stepsById[key]?.status ?? "pending",
          "data-motion": state.motion,
        }),
      }),
      "item-meta": slot<ItemPartProps & BaseSlotProps, { duration: string }>({
        props: fromItem,
        selects: ownStep,
        state: (state, { key }) => ({ duration: stepDuration(state.stepsById[key]?.durationSeconds) }),
        attrs: (state, { key }) => ({
          "data-step-part": "meta",
          "data-status": state.stepsById[key]?.status ?? "pending",
        }),
      }),
      "item-content": slot<ItemPartProps & BaseSlotProps>({
        props: fromItem,
        selects: ownStep,
        attrs: (state, { id, key }) => {
          const open = state.openSteps.includes(key);
          return {
            id: `${id}-step-${idPart(key)}`,
            "data-step-part": "content",
            "data-status": state.stepsById[key]?.status ?? "pending",
            "data-motion": state.motion,
            ...openAttrs(open),
            ...hiddenAttrs(open || state.exitingSteps.includes(key), true),
          };
        },
        bind: (el, { api, key }) => api.bindStepContent(el, key),
      }),
    };
  },
  // Steps are listed by title, so an agent can name one to `expandStep`, and an unknown one is refused.
  agent: {
    actions: ["expand", "collapse", "expandStep"],
    items: (api: ChainOfThoughtApi) => api.getSteps().map((step) => ({ value: step.id, label: step.title })),
    closed: true,
  },
});
