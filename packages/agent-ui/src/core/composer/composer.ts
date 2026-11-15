import { type ChangeDetails, createChange, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";

export type ComposerOptions = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, details: ChangeDetails<"input">) => void;
  onSubmit?: (value: string) => unknown;
  disabled?: boolean;
};

export type ComposerState = { value: string; pending: boolean };

export type ComposerApi = {
  setValue: (value: string, event?: Event) => boolean;
  submit: () => void;
};

type ComposerSlot = SlotDefinition<ComposerState, ComposerApi, BaseSlotProps, Record<never, never>>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ComposerPrimitive = ReturnType<
  typeof definePrimitive<
    ComposerOptions,
    ComposerState,
    ComposerApi,
    Record<"root" | "input" | "submit", ComposerSlot>
  >
>;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === "function";

export const composerPrimitive: ComposerPrimitive = definePrimitive({
  name: "kind-composer",
  options: {
    value: "string",
    defaultValue: "string",
    onValueChange: "callback",
    onSubmit: "action",
    disabled: "boolean",
  },
  state: (options: ComposerOptions): ComposerState => ({
    value: options.value ?? options.defaultValue ?? "",
    pending: false,
  }),
  sync: (options: ComposerOptions) => (options.value === undefined ? {} : { value: options.value }),
  controlled: ["value"],
  api: (context): ComposerApi => {
    const change = createChange(context);
    return {
      setValue: (value: string, event?: Event) =>
        change("value", value, event ? { reason: "input", event } : { reason: "input" }),
      submit: () => {
        const { onSubmit, disabled } = context.options();
        const { value, pending } = context.store.get();
        if (disabled || pending || !onSubmit) return;
        const result = onSubmit(value);
        if (!isThenable(result)) return;
        context.store.set({ pending: true });
        const settle = () => context.store.set({ pending: false });
        result.then(settle, settle);
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "form",
      attrs: (state) => ({
        "data-pending": state.pending ? "" : undefined,
        "aria-busy": state.pending ? "true" : undefined,
      }),
      on: { submit: (event) => event.preventDefault() },
    }),
    input: slot({
      attrs: (state) => ({ "data-pending": state.pending ? "" : undefined }),
      on: {
        input: (event, { api }) => api.setValue((event.target as HTMLTextAreaElement).value, event),
      },
      bind: (el, part) => {
        const field = el as HTMLTextAreaElement;
        const write = () => {
          const { value } = part.store.get();
          if (field.value !== value) field.value = value;
        };
        write();
        return part.store.subscribe(write);
      },
    }),
    submit: slot({
      role: "button",
      focus: "native",
      press: ({ api }) => api.submit(),
      attrs: (state) => ({
        type: "button",
        "data-pending": state.pending ? "" : undefined,
        "aria-disabled": state.pending ? "true" : undefined,
      }),
    }),
  }),
  agent: { actions: ["setValue", "submit"] },
});
