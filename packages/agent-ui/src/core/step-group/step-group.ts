import { announce, definePrimitive, hiddenAttrs, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepGroupItem, StepStatus } from "../../types/index.js";
import { aggregateStatus } from "../aggregate.js";
import { bindStepPanel, type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";
import { plainText } from "../words.js";
import {
  isFinished,
  type StepGroupKinds,
  stepGroupFinished,
  stepGroupMeta,
  stepGroupTitle,
} from "./title.js";

export type StepGroupOptions = StepOptions & {
  /** The steps inside, in order, since core can't read the host's rows. Their statuses give the group's status. */
  items?: StepGroupItem[];
  /** How each kind of step reads, keyed by an item's `kind`: `{ read: { live: "Reading", done: "Read", one: "file", many: "files" } }`. */
  kinds?: StepGroupKinds;
  /**
   * How many kinds the title names before "and N other steps".
   * @default 2
   */
  maxClauses?: number;
  /**
   * With fewer items, the steps show flat, without the group's row.
   * @default 3
   */
  minItems?: number;
  /** The live step's words while steps run, like "Running `npm test`". Defaults to the running item's kind and target. */
  current?: string;
};

export type StepGroupState = StepState & {
  /** The `label`, else the work in words: the live step while running, what was done once finished. Code is in backticks. */
  title: string;
  /** "3 of 5", "1 waiting", "Waiting for approval", "1 failed · 41 sec", "Stopped after 41 sec" or the duration. */
  meta: string;
  /** The trigger's name: the title and the meta, as a sentence. */
  name: string;
  /** Whether there are too few items to group, so the steps show flat. */
  flat: boolean;
  items: StepGroupItem[];
};

export type StepGroupApi = StepApi & {
  /** Folds the group a second after it finishes, once nothing inside has focus or a selection. Bound by the root. */
  bindFold: () => () => void;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  StepGroupState,
  StepGroupApi,
  BaseSlotProps,
  Public
>;

type StepGroupSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<{ title: string }>;
  meta: Slot<{ meta: string }>;
  content: Slot;
  children: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StepGroupPrimitive = ReturnType<
  typeof definePrimitive<StepGroupOptions, StepGroupState, StepGroupApi, StepGroupSlots>
>;

const NO_ITEMS: StepGroupItem[] = [];
const FOLD_AFTER = 1000;
const TOGETHER = 300;

const statusOf = (options: StepGroupOptions) =>
  aggregateStatus((options.items ?? NO_ITEMS).map((item) => item.status));

const base = stepBase<StepGroupState, StepGroupApi, StepGroupOptions>({
  kind: "step-group",
  status: statusOf,
  // The group's outcomes are read as one sentence of the steps that finished, below; a waiting step says so itself.
  announcement: () => undefined,
  // A closed group never hides a waiting step, even after a person closed it; folding waits (`bindFold`).
  nextOpen: ({ status, open, userToggled, autoOpen }) => {
    if (autoOpen === "never") return open;
    if (status === "awaiting-input") return true;
    return status === "running" && !userToggled ? true : open;
  },
});

const words = (options: StepGroupOptions, status: StepStatus, open: boolean) => {
  const items = options.items ?? NO_ITEMS;
  const title =
    options.label ??
    stepGroupTitle({
      status,
      items,
      kinds: options.kinds,
      maxClauses: options.maxClauses,
      current: options.current,
    });
  const meta = stepGroupMeta({ status, items, open, durationSeconds: options.durationSeconds });
  return {
    title,
    meta,
    name: meta ? `${plainText(title)}, ${meta.split(" · ").join(", ")}` : plainText(title),
  };
};

const presentation = (options: StepGroupOptions) => ({
  items: options.items ?? NO_ITEMS,
  flat: (options.items ?? NO_ITEMS).length < (options.minItems ?? 3),
});

export const stepGroupPrimitive: StepGroupPrimitive = definePrimitive<
  StepGroupOptions,
  StepGroupState,
  StepGroupApi,
  StepGroupSlots
>({
  name: "kind-step-group",
  ...base,
  options: {
    ...base.options,
    items: "value",
    kinds: "value",
    maxClauses: "number",
    minItems: "number",
    current: "string",
  },
  state: (options) => {
    const state = base.state(options);
    return { ...state, ...presentation(options), ...words(options, state.status, state.open) };
  },
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  api: (context) => {
    const { store } = context;
    const stepApi = base.api(context);
    let prevItems = store.get().items;
    // Web hosts can only set `items` once the element exists, so steps in the first frame don't announce.
    let mounting = true;
    let together: StepGroupItem[] = [];
    let togetherTimer: ReturnType<typeof setTimeout> | undefined;
    let foldTimer: ReturnType<typeof setTimeout> | undefined;

    // The words follow the open state ("1 waiting" open, "Waiting for approval" folded), so they're kept in step.
    const reword = () => {
      const { status, open, title, meta } = store.get();
      const next = words(context.options(), status, open);
      if (next.title !== title || next.meta !== meta) store.set(next);
    };
    store.subscribe(reword);
    context.onOptions(() => queueMicrotask(reword));

    const reading = () => {
      const content = context.element("content");
      const doc = content?.ownerDocument;
      if (!content || !doc) return false;
      const active = doc.activeElement;
      const selection = doc.getSelection();
      return (
        (active !== null && content.contains(active)) ||
        (selection !== null && !selection.isCollapsed && content.contains(selection.anchorNode))
      );
    };
    const fold = () => {
      clearTimeout(foldTimer);
      foldTimer = setTimeout(() => {
        const { status, open, userToggled } = store.get();
        if (!open || userToggled || !isFinished(status)) return;
        if (reading()) fold();
        else stepApi.setOpen(false, { reason: "auto" });
      }, FOLD_AFTER);
    };

    const announceTogether = () => {
      const { status } = store.get();
      // One step finishing while others run is read by its own row; several, or the last, are read together.
      if (together.length > 1 || isFinished(status)) {
        announce(stepGroupFinished(together, context.options().kinds), { priority: "polite" });
      }
      together = [];
    };

    let prevStatus = store.get().status;
    context.onOptions((options, synced) => {
      const items = options.items ?? NO_ITEMS;
      if (items !== prevItems) {
        const before = new Map(prevItems.map((item) => [item.id, item.status]));
        prevItems = items;
        const finished = items.filter(
          (item) => isFinished(item.status) && item.status !== (before.get(item.id) ?? "pending"),
        );
        if (!mounting && finished.length) {
          together = [
            ...together.filter((item) => !finished.some((each) => each.id === item.id)),
            ...finished,
          ];
          clearTimeout(togetherTimer);
          togetherTimer = setTimeout(announceTogether, TOGETHER);
        }
      }
      const status = synced?.status ?? prevStatus;
      if (status !== prevStatus) {
        prevStatus = status;
        if (isFinished(status) && !store.get().userToggled) fold();
        else clearTimeout(foldTimer);
      }
    });

    context.onDestroy(() => {
      clearTimeout(foldTimer);
      clearTimeout(togetherTimer);
    });

    return {
      ...stepApi,
      bindFold: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, meta, content, children } = base.slots(slot);
    return {
      root: slot({
        ...root,
        attrs: (state, part) => ({
          ...root.attrs?.(state, part),
          "aria-labelledby": state.flat ? undefined : `${part.id}-title`,
          "data-flat": state.flat ? "" : undefined,
        }),
        bind: (el, part) => {
          const release = root.bind?.(el, part);
          const unbind = part.api.bindFold();
          return () => {
            release?.();
            unbind();
          };
        },
      }),
      trigger: slot({
        ...trigger,
        present: (state) => !state.flat,
        attrs: (state, part) => ({ ...trigger.attrs?.(state, part), "aria-label": state.name }),
      }),
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      meta: slot<BaseSlotProps, { meta: string }>({
        ...meta,
        present: (state) => state.stalled || state.meta !== "",
        state: (state) => ({ meta: state.meta }),
      }),
      content: slot({
        ...content,
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          // Rows inside mark only what needs a person: a complete step's mark is a quiet dot (`status-mark.css`).
          "data-quiet-complete": "",
          ...hiddenAttrs(state.open || state.exiting || state.flat, true),
        }),
        bind: (el, { api, store }) =>
          bindStepPanel(el, {
            isOpen: () => store.get().open || store.get().flat,
            isExiting: () => store.get().exiting,
            motion: () => store.get().motion,
            reveal: (event) => api.setOpen(true, { reason: "find-in-page", event }),
            trigger: api.trigger,
            subscribe: store.subscribe,
            exited: () => store.set({ exiting: false }),
          }),
      }),
      children,
    };
  },
  agent: { actions: ["expand", "collapse"] },
});
