"use client";

import { LAUNCHER_INITIAL_FOCUS, launcherPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, renderElement } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactNode } from "react";

const parts = createParts(launcherPrimitive, {
  root: "div",
  trigger: "button",
  badge: "span",
  backdrop: "div",
  viewport: "div",
  content: "div",
  title: "h2",
  close: "button",
});

export type LauncherProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: ReactNode };

/**
 * A floating button in the page's bottom end corner that opens a chat. Its `children` are the chat, usually a
 * Conversation and a Composer, which stays mounted while the panel is closed, so a draft and the scroll survive.
 */
export function Launcher({ children, ...props }: LauncherProps) {
  return (
    <parts.Root {...props}>
      <LauncherTrigger />
      <LauncherBackdrop />
      <LauncherContent>
        {DEFAULT_HEADER}
        {children}
      </LauncherContent>
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const LauncherRoot = parts.Root;

export type LauncherTriggerProps = ComponentProps<typeof parts.Trigger>;

/** The floating button: a chat glyph that turns into a cross while open, and the unread badge, unless you pass children. */
export function LauncherTrigger({ children = DEFAULT_TRIGGER, ...props }: LauncherTriggerProps) {
  return <parts.Trigger {...props}>{children}</parts.Trigger>;
}

export type LauncherBadgeProps = ComponentProps<typeof parts.Badge>;

/** The unread count, rendered while `unread` is above 0. Hidden from assistive technology: the button's name says it. */
export function LauncherBadge({ children = ({ text }) => text, ...props }: LauncherBadgeProps) {
  return <parts.Badge {...props}>{children}</parts.Badge>;
}

/** Dims the page behind a `modal` panel. */
export const LauncherBackdrop = parts.Backdrop;

export type LauncherContentProps = Omit<ComponentProps<typeof parts.Content>, "children"> & {
  children?: ReactNode;
};

/**
 * The panel: a header with the title and Close, unless you pass children. It stays mounted while closed, and focus
 * moves to the first composer's editor inside as it opens.
 */
export function LauncherContent({ children = DEFAULT_HEADER, render, ...props }: LauncherContentProps) {
  return (
    <parts.Content
      initialFocus={LAUNCHER_INITIAL_FOCUS}
      keepMounted
      side="top"
      align="end"
      sideOffset={12}
      {...props}
      // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
      render={(content, state) => {
        const element = renderElement("div", content, render, state);
        return state.presentation === "sheet" ? <parts.Viewport>{element}</parts.Viewport> : element;
      }}
    >
      {children}
    </parts.Content>
  );
}

export type LauncherTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Names the panel. */
export function LauncherTitle({ children = ({ label }) => label, ...props }: LauncherTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

/** Closes the panel and returns focus to the button. */
export const LauncherClose = parts.Close;

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_TRIGGER = (
  <>
    <span data-launcher-icon="" />
    <LauncherBadge />
  </>
);

const DEFAULT_HEADER = (
  <div data-launcher-header="">
    <LauncherTitle />
    <LauncherClose />
  </div>
);
