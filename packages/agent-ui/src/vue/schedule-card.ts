import { type ScheduleCardEnabledState, scheduleCardPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slots } from "vue";
import { KindSwitch, KindSwitchThumb } from "./internal/switch.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onEdit`, whose presence offers Edit, is declared an action instead, which `@edit` still binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => scheduleCardPrimitive(options), scheduleCardPrimitive, {
    options: { ...scheduleCardPrimitive.options, onEdit: "action" },
  }),
  "name",
  { value: scheduleCardPrimitive.name },
) as typeof scheduleCardPrimitive;

const parts = createParts(primitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "p",
  next: "p",
  last: "p",
  "last-mark": "span",
  "last-link": "a",
  enabled: "label",
  "run-now": "button",
  edit: "button",
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

/** The calendar glyph before the title. */
export const ScheduleCardIcon = parts.Icon;

/** The schedule's `label`, unless you fill its slot. */
export const ScheduleCardTitle = withDefault(
  parts.Title,
  "ScheduleCardTitle",
  ({ state }: { state: { label: string } }) => state.label,
);

/** The schedule in the host's words, unless you fill its slot. */
export const ScheduleCardDescription = withDefault(
  parts.Description,
  "ScheduleCardDescription",
  ({ state }: { state: { text: string } }) => state.text,
);

/** "Next run 9:00 AM", a countdown within the hour, or "Paused", unless you fill its slot. */
export const ScheduleCardNext = withDefault(
  parts.Next,
  "ScheduleCardNext",
  ({ state }: { state: { text: string } }) => state.text,
);

export const ScheduleCardLastMark = parts.LastMark;

/** How the last run ended and when, linked to its `href`, unless you fill its slot. */
export const ScheduleCardLastLink = withDefault(
  parts.LastLink,
  "ScheduleCardLastLink",
  ({ state }: { state: { text: string } }) => state.text,
);

/** The last run's status mark and words, unless you fill its slot. Rendered only with a `lastRun`. */
export const ScheduleCardLast = withDefault(parts.Last, "ScheduleCardLast", () => [
  h(ScheduleCardLastMark),
  h(ScheduleCardLastLink),
]);

/** "Enabled" and a UI SDK Switch showing `schedule.enabled`, unless you fill its slot. */
export const ScheduleCardEnabled = withDefault(
  parts.Enabled,
  "ScheduleCardEnabled",
  // UI SDK's slot state is read key by key: a spread copies nothing.
  ({ state }: { state: ScheduleCardEnabledState }) => [
    state.label,
    // Hidden from agents, which use the Schedule Card's own `setEnabled`.
    h(
      KindSwitch,
      {
        checked: state.checked,
        onCheckedChange: state.onCheckedChange,
        "aria-label": state["aria-label"],
        "data-agent-hidden": "",
      },
      () => h(KindSwitchThumb),
    ),
  ],
);

/** Calls `onRunNow`. "Run now", or "Starting" while pending, unless you fill its slot. Rendered only with `on-run-now`. */
export const ScheduleCardRunNow = withDefault(
  parts.RunNow,
  "ScheduleCardRunNow",
  ({ state }: { state: { label: string } }) => state.label,
);

/** Calls `onEdit`, as a pencil icon button named "Edit schedule". Rendered only with `on-edit`. */
export const ScheduleCardEdit = parts.Edit;

/**
 * A recurring run: its name and schedule, when it runs next and how it last ran, an Enabled switch, Run now and Edit.
 * A default slot replaces the parts.
 */
export const ScheduleCard = withDefault(parts.Root, "ScheduleCard", () => [
  h(ScheduleCardIcon),
  h(ScheduleCardTitle),
  h(ScheduleCardDescription),
  h(ScheduleCardNext),
  h(ScheduleCardLast),
  h(ScheduleCardEnabled),
  h(ScheduleCardRunNow),
  h(ScheduleCardEdit),
]);

/** The bare root, for arranging the parts yourself. */
export const ScheduleCardRoot = parts.Root;
