import type { SettingsEntry } from "../../types/index.js";
import { definePrimitive } from "../define-primitive.js";
import {
  type SettingsBaseApi,
  type SettingsBaseOptions,
  type SettingsBaseSlots,
  type SettingsBaseState,
  settingsBase,
  settingsData,
} from "./base.js";

/** A Settings Menu's options: the menu's, plus its settings and their values. */
export type SettingsMenuOptions = SettingsBaseOptions & {
  /**
   * Names the trigger, an icon button.
   * @default "Settings"
   */
  label?: string;
};

export type SettingsMenuState = SettingsBaseState;
export type SettingsMenuApi = SettingsBaseApi;
type SettingsMenuSlots = SettingsBaseSlots<SettingsMenuState, SettingsMenuApi>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SettingsMenuPrimitive = ReturnType<
  typeof definePrimitive<SettingsMenuOptions, SettingsMenuState, SettingsMenuApi, SettingsMenuSlots>
>;

const NO_SETTINGS: SettingsEntry<unknown>[] = [];

const base = settingsBase<SettingsMenuOptions>({
  kind: "settings-menu",
  label: "Settings",
  toData: (options) => settingsData(options.settings ?? NO_SETTINGS),
});

export const settingsMenuPrimitive: SettingsMenuPrimitive = definePrimitive<
  SettingsMenuOptions,
  SettingsMenuState,
  SettingsMenuApi,
  SettingsMenuSlots
>({
  name: "kind-settings-menu",
  options: base.options,
  state: base.state,
  sync: base.sync,
  controlled: base.controlled,
  api: base.api,
  slots: (slot) => base.slots(slot),
  agent: base.agent,
});
