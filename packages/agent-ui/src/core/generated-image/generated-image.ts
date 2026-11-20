import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createPopup,
  css,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPartState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupBackdrop,
  popupClose,
  popupContent,
  popupState,
  popupTitle,
  popupTrigger,
  type SlotDefinition,
} from "@ui-sdk/core";
import { type DialogOpenChangeReason, dialogPreset } from "@ui-sdk/core/dialog";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import type { MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { holdTransitions } from "../step/base.js";

/** What the host says of the image: still being made, ready at `src`, or failed. */
export type GeneratedImageStatus = "generating" | "ready" | "error";

/** Who pressed Download, and how: Download's own button, or a call to the api or an agent's. */
export type GeneratedImageDownloadDetails = ActionDetails & { reason: "download-press" | "imperative" };

/** What shows: `generating`, then `loading` once the host is `ready`, and `loaded` once the image is in. */
export type GeneratedImagePhase = "generating" | "loading" | "loaded" | "error";

export type GeneratedImageOptions = {
  /** Describes the image. Names it, and titles the full size view. */
  alt: string;
  /** The image's URL. Set it with, or before, `status` `"ready"`; until it's set the frame shows "Loading image". */
  src?: string;
  /**
   * `"generating"` while the image is being made, `"ready"` once `src` holds it, `"error"` when it failed. Any other
   * value reads as `"ready"`.
   * @default "ready"
   */
  status?: GeneratedImageStatus;
  /**
   * How far generation has come, from 0 to 100. The preview sharpens as it rises, and the corner reads it, like
   * "Creating image · 42%". Without it, the preview stays blurred and the corner reads "Creating image".
   */
  progress?: number;
  /** A partial image's URL while generating. It shows blurred, sharpening with `progress`, until the image loads. */
  preview?: string;
  /**
   * The image's width in pixels. With `height`, it gives the frame its shape in every phase, so nothing moves when
   * the image arrives.
   * @default 1024
   */
  width?: number;
  /**
   * The image's height in pixels.
   * @default 1024
   */
  height?: number;
  /** What went wrong, shown in the frame when `status` is `"error"` or the image fails to load. */
  error?: string;
  /**
   * Called when Download is pressed. Shows Download while set. The host fetches and saves the file; return a promise
   * to keep Download pending until it settles. If it rejects or throws, Download is offered again and the component
   * announces "Download failed".
   */
  onDownload?: (details: GeneratedImageDownloadDetails) => unknown;
  /** Whether the full size view is open. Passing it controls it. */
  open?: boolean;
  /**
   * Whether the full size view opens by itself, when `open` isn't passed. It opens once the image loads.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the full size view opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<DialogOpenChangeReason>) => void;
  /**
   * At full motion the preview sharpens smoothly, the image fades in over it and the full size view rises in.
   * Reduced motion sharpens the preview in steps and only fades, in 120 ms. `"none"` doesn't animate. `"auto"` follows
   * `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type GeneratedImageState = PopupState & {
  /** The `alt` option. */
  alt: string;
  /** The `src` option. */
  src: string | undefined;
  /** The `status` option, `"ready"` without one. */
  status: GeneratedImageStatus;
  /** The `progress` option, kept within 0–100. */
  progress: number | undefined;
  /** The `preview` option. */
  preview: string | undefined;
  /** The `width`, else 1024. */
  width: number;
  /** The `height`, else 1024. */
  height: number;
  /** The `error` option. */
  error: string | undefined;
  /** What shows, from `status` and whether the image at `src` loaded. */
  phase: GeneratedImagePhase;
  /** The `src` the image last loaded. */
  loadedSrc: string | undefined;
  /** The `src` the image last failed to load. */
  failedSrc: string | undefined;
  /** Whether `onDownload` is set. */
  canDownload: boolean;
  /** Whether a promise `onDownload` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** The `motion` option, `"auto"` without one. */
  motion: MotionMode;
};

type Popup = ReturnType<typeof createPopup<GeneratedImageOptions, GeneratedImageState, PopupPreset>>;

export type GeneratedImageApi = Omit<Popup, "open" | "close"> & {
  /** Opens the full size view. Offered while the image is loaded and the view is closed. */
  readonly open: (() => boolean) | undefined;
  /** Closes the full size view. Offered while it's open. */
  readonly close: (() => boolean) | undefined;
  /** Calls `onDownload`. Offered while `onDownload` is set, the image is loaded and no download is pending. */
  readonly download: ((event?: Event) => void) | undefined;
  /** What the progress part hands UI SDK's Progress. Called by the progress slot. */
  progressState: (state: GeneratedImageState) => GeneratedImageProgressState;
  /** What went wrong: the `error`, else why the image is missing. Called by the error slot. */
  errorMessage: (state: GeneratedImageState) => string;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<GeneratedImageState, GeneratedImageApi, Props, Public>;

/** What the progress part hands UI SDK's Progress. */
export type GeneratedImageProgressState = {
  /** Pass it to the Progress as its `value`: null while how far is unknown. */
  value: number | null;
  /** The Progress's label: "Creating image", or "Loading image" once the host is ready. */
  label: string;
};

type GeneratedImageSlots = {
  root: Slot;
  frame: Slot;
  preview: Slot;
  progress: Slot<BaseSlotProps, GeneratedImageProgressState>;
  image: Slot;
  error: Slot<BaseSlotProps, { message: string }>;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState>;
  download: Slot;
  backdrop: Slot<BaseSlotProps, PopupPartState>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  "full-image": Slot;
  title: Slot<BaseSlotProps, { alt: string }>;
  close: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type GeneratedImagePrimitive = ReturnType<
  typeof definePrimitive<GeneratedImageOptions, GeneratedImageState, GeneratedImageApi, GeneratedImageSlots>
>;

const STATUSES: readonly GeneratedImageStatus[] = ["generating", "ready", "error"];

const dimension = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) && value > 0 ? value : 1024;

const presentation = (options: GeneratedImageOptions) => ({
  alt: options.alt ?? "",
  src: options.src || undefined,
  status: options.status && STATUSES.includes(options.status) ? options.status : "ready",
  progress:
    options.progress !== undefined && Number.isFinite(options.progress)
      ? Math.min(100, Math.max(0, options.progress))
      : undefined,
  preview: options.preview || undefined,
  width: dimension(options.width),
  height: dimension(options.height),
  error: options.error || undefined,
  canDownload: options.onDownload !== undefined,
  motion: options.motion ?? "auto",
});

const phaseOf = ({
  status,
  src,
  loadedSrc,
  failedSrc,
}: Pick<GeneratedImageState, "status" | "src" | "loadedSrc" | "failedSrc">): GeneratedImagePhase => {
  if (status !== "ready") return status;
  if (src !== undefined && src === failedSrc) return "error";
  return src !== undefined && src === loadedSrc ? "loaded" : "loading";
};

type ImageStore = { set(state: Partial<GeneratedImageState>): void };

// The attribute rather than `src`, which the browser resolves to a full URL.
const settle = (image: HTMLImageElement, store: ImageStore, loaded: boolean) => {
  const src = image.getAttribute("src");
  if (src) store.set(loaded ? { loadedSrc: src } : { failedSrc: src });
};

export const generatedImagePrimitive: GeneratedImagePrimitive = definePrimitive<
  GeneratedImageOptions,
  GeneratedImageState,
  GeneratedImageApi,
  GeneratedImageSlots
>({
  name: "kind-generated-image",
  options: {
    alt: "string",
    src: "string",
    status: "string",
    progress: "number",
    preview: "string",
    width: "number",
    height: "number",
    error: "string",
    onDownload: "action",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => {
    const image = { ...presentation(options), loadedSrc: undefined, failedSrc: undefined };
    // `defaultOpen` waits for the image: the subscription in `api` opens the view once it loads.
    return {
      ...popupState({ open: options.open ?? false }),
      ...image,
      phase: phaseOf(image),
      pending: false,
    };
  },
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open", "phase"],
  api: (context) => {
    const { store } = context;
    const popup = createPopup(context, { preset: dialogPreset });
    const pendingDownload = createPendingAction(context, { state: "pending" });
    // Outcomes are announced only for an image this instance saw being made, so a page of earlier images is quiet.
    let sawGenerating = store.get().phase === "generating";
    let shown = store.get().phase;
    let openWhenLoaded = context.options().open === undefined && context.options().defaultOpen === true;
    store.subscribe(() => {
      const state = store.get();
      const phase = phaseOf(state);
      if (phase !== state.phase) return store.set({ phase });
      if (phase === shown) return;
      // The full size view has nothing to show once its image goes.
      if (shown === "loaded" && state.open) popup.setOpen(false);
      shown = phase;
      if (phase === "generating") sawGenerating = true;
      if (phase === "loaded" && openWhenLoaded) {
        openWhenLoaded = false;
        popup.setOpen(true);
      }
      if (sawGenerating && (phase === "loaded" || phase === "error"))
        announce(phase === "loaded" ? "Image ready" : "Image failed", { priority: "polite" });
    });
    const download = (event?: Event) => {
      const { onDownload } = context.options();
      if (!onDownload) return;
      const reason = event ? "download-press" : "imperative";
      const details = { reason, source: actionSource(event, reason) } as const;
      void pendingDownload
        .run(() => onDownload(details))
        ?.then((outcome) => {
          if (outcome === "failed") announce("Download failed", { priority: "polite" });
        });
    };
    return {
      ...popup,
      // The bridge's generic `press` opens a popup first, so the view refuses to open without an image to show.
      setOpen: (open, options) =>
        open && store.get().phase !== "loaded" ? false : popup.setOpen(open, options),
      get open() {
        const { phase, open } = store.get();
        return phase === "loaded" && !open ? () => popup.setOpen(true) : undefined;
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      get download() {
        const { canDownload, pending, phase } = store.get();
        return canDownload && !pending && phase === "loaded" ? download : undefined;
      },
      progressState: (state) =>
        state.phase === "generating"
          ? { value: state.progress ?? null, label: "Creating image" }
          : { value: null, label: "Loading image" },
      errorMessage: (state) =>
        state.error ??
        (state.status === "error" ? "The image couldn't be generated." : "The image couldn't be loaded."),
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const close = popupClose(slot);
    const backdrop = popupBackdrop(slot);
    const content = popupContent(slot);
    return {
      root: slot({
        role: "figure",
        attrs: (state) => ({
          "aria-label": state.alt,
          "aria-busy": state.phase === "generating" || state.phase === "loading" ? "true" : undefined,
          "data-phase": state.phase,
          "data-motion": state.motion,
        }),
        bind: holdTransitions,
      }),
      frame: slot({
        attrs: (state) => ({
          "data-phase": state.phase,
          style: css({
            "aspect-ratio": `${state.width} / ${state.height}`,
            "--kind-generated-image-width": `${state.width}px`,
            // How resolved the preview looks, from 0 to 1: generation's progress, then whole once the host is ready.
            "--kind-generated-image-resolve": String(
              state.phase === "generating" ? (state.progress ?? 0) / 100 : 1,
            ),
          }),
        }),
      }),
      preview: slot({
        present: (state) => state.preview !== undefined && state.phase !== "error",
        attrs: (state) => ({ src: state.preview, alt: "", "aria-hidden": "true" }),
      }),
      progress: slot<BaseSlotProps, GeneratedImageProgressState>({
        present: (state) => state.phase === "generating" || state.phase === "loading",
        state: (state, { api }) => api.progressState(state),
      }),
      image: slot({
        present: (state) => state.status === "ready" && state.src !== undefined && state.phase !== "error",
        attrs: (state) => ({
          src: state.src,
          alt: state.alt,
          width: String(state.width),
          height: String(state.height),
          "data-loaded": state.phase === "loaded" ? "" : undefined,
        }),
        on: {
          load: (event, { store }) => settle(event.currentTarget as HTMLImageElement, store, true),
          error: (event, { store }) => settle(event.currentTarget as HTMLImageElement, store, false),
        },
        // An image the server rendered may have loaded, or failed, before its listeners were bound.
        bind: (el, { store }) => {
          const image = el as HTMLImageElement;
          if (image.complete) settle(image, store, image.naturalWidth > 0);
        },
      }),
      error: slot<BaseSlotProps, { message: string }>({
        present: (state) => state.phase === "error",
        state: (state, { api }) => ({ message: api.errorMessage(state) }),
      }),
      trigger: slot({
        ...trigger,
        present: (state) => state.phase === "loaded",
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": "View full size",
        }),
      }),
      download: slot({
        role: "button",
        focus: "native",
        present: (state) => state.canDownload && state.phase === "loaded",
        press: ({ api }, event) => api.download?.(event),
        attrs: (state) => ({
          type: "button",
          "aria-label": "Download",
          "data-kind-button": "secondary",
          "data-pending": state.pending ? "" : undefined,
        }),
      }),
      backdrop: slot({
        ...backdrop,
        attrs: (state, part) => ({ ...backdrop.attrs?.(state, part), "data-kind-scrim": "" }),
      }),
      content: slot({
        ...content,
        attrs: (state, part) => ({ ...content.attrs?.(state, part), "data-kind-dialog": "" }),
      }),
      // The image that last loaded, so a view an owner keeps open while the next one generates isn't blank.
      "full-image": slot({
        attrs: (state) => ({
          src: state.loadedSrc ?? state.src,
          alt: state.alt,
          width: String(state.width),
          height: String(state.height),
        }),
      }),
      title: slot({ ...popupTitle(slot), state: (state) => ({ alt: state.alt }) }),
      close: slot({
        ...close,
        attrs: (state, part) => ({ ...close.attrs?.(state, part), type: "button", "data-kind-button": "" }),
      }),
    };
  },
  agent: { actions: ["open", "close", "download"] },
});
