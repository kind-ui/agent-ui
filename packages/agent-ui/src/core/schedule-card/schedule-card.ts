import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  type ChangeSource,
  createChange,
  definePrimitive,
  dispatch,
  pageLocale,
  prepareAnnouncements,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Schedule, StepStatus } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { hearComposed } from "../composed-events.js";
import { type Countdown, countdownText, createCountdown } from "../countdown.js";
import { sanitizeUrl } from "../markdown/index.js";
import { memo } from "../memo.js";
import { createPendingAction } from "../pending.js";
import { timeLabel, todayKey } from "../time.js";
import { everyMinute } from "../today.js";

/** `"switch-press"`: a person turned the Enabled switch. `"imperative"`: an `api` call, like an agent's `setEnabled`. */
export type ScheduleEnabledChangeReason = "switch-press" | "imperative";

/** Who pressed Run now or Edit: the button, or a call to the api or an agent's. */
export type ScheduleCardActionDetails = ActionDetails & {
  reason: "run-now-press" | "edit-press" | "imperative";
};

export type ScheduleCardOptions = {
  /** The recurring run the card shows: its name, its schedule in words, whether it's on, and its next and last runs. */
  schedule?: Schedule;
  /**
   * Called when a person turns the Enabled switch, or `setEnabled` runs. The switch shows `schedule.enabled`, so pass
   * a schedule with the new value to take the change; one you don't take, or cancel, leaves the switch as it was.
   */
  onEnabledChange?: (enabled: boolean, details: ChangeDetails<ScheduleEnabledChangeReason>) => void;
  /**
   * Called when Run now is pressed. Shows Run now while set. Return a promise to keep it pending until it settles; a
   * rejection or a throw announces "Run didn't start" and offers Run now again.
   */
  onRunNow?: (details: ScheduleCardActionDetails) => unknown;
  /** Called with the schedule's `id` when Edit is pressed. Shows Edit while set. */
  onEdit?: (id: string, details: ScheduleCardActionDetails) => void;
  /**
   * Whether an agent needs a person's go-ahead for every action, since a schedule runs on its own. Renders
   * `data-agent-confirm` on the root.
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * Today, as an ISO date or instant, for the times' words. Without it, server markup shows full dates, and the
   * browser reads the clock once the card binds.
   */
  now?: string;
  /** A BCP 47 tag the times read in. Defaults to the page's language in the browser, and English on the server. */
  locale?: string;
  /**
   * The IANA time zone the times read in.
   * @default "UTC"
   */
  timeZone?: string;
};

export type ScheduleCardState = {
  /** The schedule's `label`. */
  label: string;
  /** The schedule's `description`, in the host's words. */
  description: string;
  /** The schedule's `id`. */
  id: string;
  /** Whether the schedule is on. */
  enabled: boolean;
  /** When the next run starts (ISO 8601). */
  nextRunAt: string | undefined;
  /** When the last run started (ISO 8601). */
  lastAt: string | undefined;
  /** How the last run ended. */
  lastStatus: StepStatus | undefined;
  /** The last run's `href`, when it's safe to link to. */
  lastHref: string | undefined;
  /** Whether `onRunNow` is set. */
  canRunNow: boolean;
  /** Whether `onEdit` is set. */
  canEdit: boolean;
  /** Whether a promise `onRunNow` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** The `agentConfirm` option, `true` without one. */
  agentConfirm: boolean;
  /** The `now` option. */
  now: string | undefined;
  /** The `locale` option, before the page's language fills in for it. */
  locale: string | undefined;
  /** The `timeZone` option; `undefined` reads as UTC. */
  timeZone: string | undefined;
  /** Today, read in the browser; `null` on the server. */
  today: string | null;
  /** The page's language, read in the browser; `null` on the server. */
  pageLocale: string | null;
  /** Whether the next run starts within the hour, read in the browser once a minute. */
  soon: boolean;
  /** Whole seconds until the next run while it starts within the hour, else `null`. Live: only Next run hears it. */
  seconds: number | null;
};

/** What the Enabled part hands UI SDK's Switch: pass every key but `label` to it. */
export type ScheduleCardEnabledState = {
  /** Whether the schedule is on. */
  checked: boolean;
  /** Reports a person's turn of the switch, and cancels it: the switch shows `schedule.enabled`. */
  onCheckedChange: (
    checked: boolean,
    details: { event?: Event | undefined; source?: ChangeSource; cancel(): void },
  ) => void;
  /** Names the switch. */
  "aria-label": string;
  /** The words beside the switch, not a prop of the Switch. */
  label: string;
};

/** What the last run's link shows. */
export type ScheduleCardLastState = { text: string };

export type ScheduleCardApi = {
  /** Turns the schedule on or off, as the switch does. Returns `false` when the owner refuses the change. */
  setEnabled: (enabled: boolean) => boolean;
  /** Calls `onRunNow`. Offered while it's set and no run is pending. */
  readonly runNow: ((event?: Event) => void) | undefined;
  /** Calls `onEdit`. Offered while it's set. */
  readonly edit: ((event?: Event) => void) | undefined;
  /** Internal: counts down to a next run within the hour. Bound by the root slot. */
  countdown: Countdown;
  /** Hands the Switch its props. Called by the enabled slot. */
  enabledState: (state: ScheduleCardState) => ScheduleCardEnabledState;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  ScheduleCardState,
  ScheduleCardApi,
  BaseSlotProps,
  Public
>;

type ScheduleCardSlots = {
  root: Slot;
  icon: Slot;
  title: Slot<{ label: string }>;
  description: Slot<{ text: string }>;
  next: Slot<{ text: string }>;
  last: Slot;
  "last-mark": Slot;
  "last-link": Slot<ScheduleCardLastState>;
  enabled: Slot<ScheduleCardEnabledState>;
  "run-now": Slot<{ pending: boolean; label: string }>;
  edit: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ScheduleCardPrimitive = ReturnType<
  typeof definePrimitive<ScheduleCardOptions, ScheduleCardState, ScheduleCardApi, ScheduleCardSlots>
>;

const HOUR = 3_600_000;

const LAST_RUN: Record<StepStatus, string> = {
  complete: "Last run succeeded",
  error: "Last run failed",
  cancelled: "Last run cancelled",
  "awaiting-input": "Last run needs input",
  running: "Running since",
  pending: "Starting",
};

const isStatus = (status: unknown): status is StepStatus =>
  typeof status === "string" && Object.hasOwn(LAST_RUN, status);

const presentation = (options: ScheduleCardOptions) => {
  const { schedule } = options;
  const last = schedule?.lastRun;
  return {
    label: schedule?.label ?? "",
    description: schedule?.description ?? "",
    id: schedule?.id ?? "",
    nextRunAt: schedule?.nextRunAt || undefined,
    lastAt: last?.at || undefined,
    // Web properties are untyped: an unknown status reads as no last run.
    lastStatus: isStatus(last?.status) ? last.status : undefined,
    lastHref: (last?.href && sanitizeUrl(last.href)) || undefined,
    canRunNow: options.onRunNow !== undefined,
    canEdit: options.onEdit !== undefined,
    agentConfirm: options.agentConfirm ?? true,
    now: options.now || undefined,
    locale: options.locale,
    timeZone: options.timeZone,
  };
};

type TimeState = Pick<ScheduleCardState, "now" | "today" | "locale" | "pageLocale" | "timeZone">;

const timeOptions = (state: TimeState) => ({
  now: state.now ?? state.today ?? undefined,
  locale: state.locale ?? state.pageLocale ?? undefined,
  timeZone: state.timeZone,
});

/**
 * Next run's words: "Paused" while off, a countdown ("Next run in 12 min 4 sec") within the hour, the time ("Next run
 * 9:00 AM", with the date when it isn't today), or "Not scheduled".
 */
export const scheduleNextText = (
  state: Pick<ScheduleCardState, "enabled" | "nextRunAt" | "seconds"> & TimeState,
): string => {
  if (!state.enabled) return "Paused";
  const options = timeOptions(state);
  if (state.seconds) return `Next run ${countdownText(state.seconds, options.locale)}`;
  const time = state.nextRunAt ? timeLabel(state.nextRunAt, options) : "";
  return time ? `Next run ${time}` : "Not scheduled";
};

/** The last run's words, like "Last run failed Nov 24, 9:00 AM". Empty without a last run. */
export const scheduleLastText = (
  state: Pick<ScheduleCardState, "lastAt" | "lastStatus"> & TimeState,
): string => {
  if (!state.lastStatus) return "";
  const time = state.lastAt ? timeLabel(state.lastAt, timeOptions(state)) : "";
  return time ? `${LAST_RUN[state.lastStatus]} ${time}` : LAST_RUN[state.lastStatus];
};

const hasLast = (state: ScheduleCardState) => state.lastStatus !== undefined;

/**
 * A recurring run as a card (spec §5): its schedule in the host's words, when it runs next and how it last ran, an
 * Enabled switch, Run now and Edit. It never parses a schedule.
 */
export const scheduleCardPrimitive: ScheduleCardPrimitive = definePrimitive<
  ScheduleCardOptions,
  ScheduleCardState,
  ScheduleCardApi,
  ScheduleCardSlots
>({
  name: "kind-schedule-card",
  options: {
    schedule: "value",
    onEnabledChange: "callback",
    onRunNow: "action",
    onEdit: "callback",
    agentConfirm: "boolean",
    now: "string",
    locale: "string",
    timeZone: "string",
  },
  state: (options) => ({
    ...presentation(options),
    enabled: options.schedule?.enabled === true,
    pending: false,
    // Read in the browser, from the root's `bind`, so server markup and hydration agree.
    today: null,
    pageLocale: null,
    soon: false,
    seconds: null,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(typeof options.schedule?.enabled === "boolean" ? { enabled: options.schedule.enabled } : {}),
  }),
  live: ["seconds"],
  controlled: ["enabled"],
  api: (context) => {
    const { store } = context;
    // `enabled` lives in `schedule`, so the change reads it from there to know the owner controls it.
    const change = createChange({
      ...context,
      options: () => {
        const options = context.options();
        return Object.create(options, { enabled: { value: options.schedule?.enabled } });
      },
    });
    const pendingRun = createPendingAction(context, { state: "pending" });

    const countdown = createCountdown(context, {
      key: "seconds",
      at: () => {
        const { enabled, soon, nextRunAt } = store.get();
        return enabled && soon ? nextRunAt : undefined;
      },
    });

    const setEnabled = (enabled: boolean, person?: { event?: Event | undefined; source?: ChangeSource }) => {
      if (typeof enabled !== "boolean") return false;
      if (enabled === store.get().enabled) return true;
      return change(
        "enabled",
        enabled,
        person
          ? {
              reason: "switch-press",
              ...(person.event && { event: person.event }),
              ...(person.source && { source: person.source }),
            }
          : { reason: "imperative" },
      );
    };

    const runNow = (event?: Event) => {
      const { onRunNow } = context.options();
      if (!onRunNow) return;
      const reason = event ? "run-now-press" : "imperative";
      const details = { reason, source: actionSource(event, reason) } as const;
      void pendingRun
        .run(() => onRunNow(details))
        ?.then((outcome) => {
          if (outcome === "failed") announce("Run didn't start", { priority: "polite" });
        });
    };

    const edit = (event?: Event) => {
      const reason = event ? "edit-press" : "imperative";
      dispatch(context, "onEdit", store.get().id, { reason, ...(event && { event }) });
    };

    const onCheckedChange: ScheduleCardEnabledState["onCheckedChange"] = (checked, details) => {
      // The switch shows the store's `enabled`, which only the owner's next schedule changes. Reported once the
      // switch's own change has ended, since it drops a write of the same value made while it runs.
      details.cancel();
      const { event, source } = details;
      queueMicrotask(() => setEnabled(checked, { event, ...(source && { source }) }));
    };

    const enabledState = memo(
      (checked: boolean): ScheduleCardEnabledState => ({
        checked,
        onCheckedChange,
        "aria-label": "Enabled",
        label: "Enabled",
      }),
    );

    return {
      setEnabled: (enabled) => setEnabled(enabled),
      get runNow() {
        const { canRunNow, pending } = store.get();
        return canRunNow && !pending ? runNow : undefined;
      },
      get edit() {
        return store.get().canEdit ? edit : undefined;
      },
      countdown,
      enabledState: (state) => enabledState(state.enabled),
    };
  },
  slots: (slot) => ({
    // A group named by the label, since the agent bridge names a component by its root.
    root: slot({
      role: "group",
      attrs: (state) => ({
        "aria-label": state.label || undefined,
        "data-schedule-card-part": "root",
        "data-enabled": state.enabled ? "" : undefined,
        "data-agent-confirm": state.agentConfirm ? "Changes a run that starts on its own" : undefined,
      }),
      bind: (el, { store, api }) => {
        prepareAnnouncements(el.ownerDocument);
        // Read here, never in `state`, so server markup shows full dates and hydrates before the words change.
        const read = () => {
          const { nextRunAt, timeZone, today, soon } = store.get();
          const left = nextRunAt ? Date.parse(nextRunAt) - Date.now() : Number.NaN;
          const next = { soon: left > 0 && left <= HOUR, today: todayKey(timeZone) };
          if (next.soon !== soon || next.today !== today) store.set(next);
        };
        store.set({ pageLocale: pageLocale(el) ?? null });
        read();
        const unsubscribe = store.subscribe(read);
        const stop = everyMinute(read);
        const unbindCountdown = api.countdown.bind();
        return () => {
          unsubscribe();
          stop();
          unbindCountdown();
        };
      },
    }),
    icon: slot({
      attrs: () => ({ "aria-hidden": "true", "data-schedule-card-part": "icon" }),
    }),
    title: slot<BaseSlotProps, { label: string }>({
      state: (state) => ({ label: state.label }),
      attrs: () => ({ "data-schedule-card-part": "title" }),
    }),
    description: slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: state.description }),
      attrs: () => ({ "data-schedule-card-part": "description" }),
    }),
    next: slot<BaseSlotProps, { text: string }>({
      // Reads the live `seconds`, so a tick renders this part alone.
      state: (state) => ({ text: scheduleNextText(state) }),
      attrs: (state) => ({
        "data-schedule-card-part": "next",
        "data-paused": state.enabled ? undefined : "",
      }),
    }),
    last: slot({
      present: hasLast,
      attrs: () => ({ "data-schedule-card-part": "last" }),
    }),
    "last-mark": slot({
      present: hasLast,
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-schedule-card-part": "last-mark",
        "data-status-mark": "",
        "data-status": state.lastStatus,
      }),
    }),
    // An `a` without `href` when there's no safe link, which reads as text.
    "last-link": slot<BaseSlotProps, ScheduleCardLastState>({
      present: hasLast,
      state: (state) => ({ text: scheduleLastText(state) }),
      attrs: (state) => ({ href: state.lastHref, "data-schedule-card-part": "last-link" }),
    }),
    enabled: slot<BaseSlotProps, ScheduleCardEnabledState>({
      state: (state, { api }) => api.enabledState(state),
      attrs: () => ({ "data-schedule-card-part": "enabled" }),
      // `@ui-sdk/web` fires the Switch's `checkedchange` on its own element, without bubbling.
      bind: (el, { api, store }) =>
        hearComposed(el, {
          checkedchange: (detail, event) => {
            const {
              value,
              source,
              event: cause,
            } = detail as { value: boolean; source?: ChangeSource; event?: Event };
            api.enabledState(store.get()).onCheckedChange(value, {
              event: cause,
              ...(source && { source }),
              cancel: () => event.preventDefault(),
            });
          },
        }),
    }),
    "run-now": slot<BaseSlotProps, { pending: boolean; label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canRunNow,
      press: ({ api }, event) => api.runNow?.(event),
      state: (state) => ({ pending: state.pending, label: state.pending ? "Starting" : "Run now" }),
      attrs: (state) => ({
        type: "button",
        "data-schedule-card-part": "run-now",
        "data-kind-button": "secondary",
        "data-kind-size": "sm",
        "aria-disabled": state.pending ? "true" : undefined,
        "data-pending": state.pending ? "" : undefined,
      }),
    }),
    edit: slot({
      role: "button",
      focus: "native",
      present: (state) => state.canEdit,
      press: ({ api }, event) => api.edit?.(event),
      attrs: () => ({
        type: "button",
        "aria-label": "Edit schedule",
        "data-schedule-card-part": "edit",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
      }),
    }),
  }),
  agent: { actions: ["setEnabled", "runNow", "edit"] },
});
