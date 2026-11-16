import type { PopupPreset } from "@ui-sdk/core";
import { hoverCardPreset } from "@ui-sdk/core/hover-card";
import { popoverPreset } from "@ui-sdk/core/popover";

/**
 * A Popover that also opens when the pointer or keyboard focus rests on its trigger, after a hover card's delays.
 * Pass it to `createPopup` with options from `withHover`.
 */
export const hoverPopupPreset: PopupPreset = {
  ...popoverPreset,
  focus: hoverCardPreset.focus,
  delay: hoverCardPreset.delay,
  closeDelay: hoverCardPreset.closeDelay,
};

const HOVER = { openOnHover: { value: true } };

/**
 * The options with `openOnHover` on, since `createPopup` opens on hover only when the options say so. A prototype
 * rather than a spread, because on Web Components `@ui-sdk/web` fills in the callbacks on read.
 */
export const withHover = <Options extends object>(options: Options): Options => Object.create(options, HOVER);
