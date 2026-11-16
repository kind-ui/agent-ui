import {
  type ChangeDetails,
  createFocusRecovery,
  definePrimitive,
  dispatch,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { SuggestionItem } from "../../types/index.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";

/** `"item-press"`: a person pressed a suggestion. `"imperative"`: an `api` call, like an agent's `pick`. */
export type SuggestionPickReason = "item-press" | "imperative";

export type SuggestionOptions = {
  /**
   * The suggestions, in the order they show.
   * @default []
   */
  suggestions?: SuggestionItem[];
  /** Called with a suggestion's `id` when a person or `pick` chooses it. Without it the suggestions can't be chosen. */
  onPick?: (id: string, details: ChangeDetails<SuggestionPickReason>) => void;
  /**
   * Names the row of suggestions.
   * @default "Suggestions"
   */
  label?: string;
  /**
   * How suggestions added after the first frame come in: they fade up at full motion and fade under reduced motion.
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type SuggestionState = {
  /** The `suggestions`. */
  suggestions: SuggestionItem[];
  /** The `suggestions` by `id`. */
  suggestionsById: Record<string, SuggestionItem>;
  /** The `label`, else "Suggestions". */
  label: string;
  /** Whether `onPick` is set. */
  canPick: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

export type SuggestionApi = {
  /** The `suggestions`. */
  getSuggestions: () => SuggestionItem[];
  /**
   * Chooses a suggestion by its `id`, as a press would. Returns `false` for an unknown one or when the host cancels.
   * Offered only while `onPick` is set.
   */
  readonly pick: ((id: string) => boolean) | undefined;
  /** Chooses a suggestion a person pressed. Called by the item slot. */
  press: (id: string, event?: Event) => void;
  /** Plays a suggestion's entrance when it arrives after the first frame. Called by the item slot. */
  bindItem: (el: HTMLElement, id: string) => void;
  /** Moves focus to a neighbor when the focused suggestion leaves. Bound by the item slot. */
  recovery: ReturnType<typeof createFocusRecovery<ItemProps>>;
  /** Starts counting suggestions as new after the first frame. Called by the root slot. */
  bindRoot: () => () => void;
};

type ItemProps = { value: string };

/** What the root hands its render function. */
export type SuggestionRootState = {
  /** The `label`, which names the Carousel. */
  label: string;
  /** The `suggestions` to draw, one `SuggestionItem` each. */
  suggestions: SuggestionItem[];
};

/** What a suggestion hands its render function. */
export type SuggestionItemState = {
  /** The suggestion's `label`, its first line. */
  label: string;
  /** The suggestion's `description`, a muted second line when set. */
  description: string | undefined;
};

type SuggestionSlots = {
  root: SlotDefinition<SuggestionState, SuggestionApi, BaseSlotProps, SuggestionRootState>;
  item: SlotDefinition<SuggestionState, SuggestionApi, ItemProps & BaseSlotProps, SuggestionItemState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SuggestionPrimitive = ReturnType<
  typeof definePrimitive<SuggestionOptions, SuggestionState, SuggestionApi, SuggestionSlots>
>;

const NO_SUGGESTIONS: SuggestionItem[] = [];

const byId = memo((suggestions: SuggestionItem[]) =>
  Object.fromEntries(suggestions.map((suggestion) => [suggestion.id, suggestion])),
);
const suggestionOf = (state: SuggestionState, id: string) =>
  Object.hasOwn(state.suggestionsById, id) ? state.suggestionsById[id] : undefined;

const presentation = ({ suggestions = NO_SUGGESTIONS, label, onPick, motion }: SuggestionOptions) => ({
  suggestions,
  suggestionsById: byId(suggestions),
  label: label ?? "Suggestions",
  canPick: onPick !== undefined,
  motion: motion ?? "auto",
});

// A suggestion's part hears only about its own entry.
const ownSuggestion = selects<SuggestionState, SuggestionApi, ItemProps>({
  suggestionsById: ({ key }) => [key],
  suggestions: [],
});

export const suggestionPrimitive: SuggestionPrimitive = definePrimitive<
  SuggestionOptions,
  SuggestionState,
  SuggestionApi,
  SuggestionSlots
>({
  name: "kind-suggestion",
  options: {
    suggestions: "value",
    onPick: "callback",
    label: "string",
    motion: "string",
  },
  state: presentation,
  sync: presentation,
  api: (context) => {
    const { store } = context;
    // Web hosts can only set `suggestions` once the element exists, so suggestions in the first frame count as known:
    // they don't play the entrance.
    let mounting = true;
    const known = new Set<string>();
    // Recovery runs once the lost suggestion has left `suggestions`, so keep the order from before.
    let current = store.get().suggestions.map((suggestion) => suggestion.id);
    let previous = current;

    context.onOptions((options) => {
      const ids = (options.suggestions ?? NO_SUGGESTIONS).map((suggestion) => suggestion.id);
      previous = current;
      current = ids;
      // Forgotten, so a suggestion added again plays its entrance.
      for (const id of known) if (!ids.includes(id)) known.delete(id);
    });

    const pick = (id: string, event?: Event) => {
      const state = store.get();
      if (!state.canPick || !suggestionOf(state, id)) return false;
      return !dispatch(
        context,
        "onPick",
        id,
        event ? { reason: "item-press", event } : { reason: "imperative" },
      );
    };

    return {
      getSuggestions: () => store.get().suggestions,
      get pick() {
        return store.get().canPick ? (id: string) => pick(id) : undefined;
      },
      press: (id, event) => void pick(id, event),
      bindItem: (el, id) => {
        if (known.has(id)) return;
        known.add(id);
        if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
      },
      recovery: createFocusRecovery<ItemProps>({
        fallback: (lost) => {
          const order = current.includes(lost.key) ? current : previous;
          const index = order.indexOf(lost.key);
          const at = (id: string | undefined) => (id === undefined ? null : context.element("item", id));
          return at(order[index + 1]) ?? at(order[index - 1]) ?? undefined;
        },
      }),
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, SuggestionRootState>({
      role: "group",
      state: (state) => ({ label: state.label, suggestions: state.suggestions }),
      attrs: (state) => ({ "aria-label": state.label, "data-motion": state.motion }),
      bind: (_el, { api }) => api.bindRoot(),
    }),
    item: slot<ItemProps & BaseSlotProps, SuggestionItemState>({
      role: "button",
      focus: "native",
      props: { value: "string" },
      selects: ownSuggestion,
      press: ({ api, key }, event) => api.press(key, event),
      state: (state, { key }) => ({
        label: suggestionOf(state, key)?.label ?? "",
        description: suggestionOf(state, key)?.description,
      }),
      attrs: (state) => ({ type: "button", "aria-disabled": state.canPick ? undefined : "true" }),
      bind: (el, part) => {
        part.api.bindItem(el, part.key);
        return part.api.recovery.bind(el, part);
      },
    }),
  }),
  agent: {
    actions: ["pick"],
    items: (api: SuggestionApi) =>
      api.getSuggestions().map((suggestion) => ({ value: suggestion.id, label: suggestion.label })),
    closed: true,
  },
});
