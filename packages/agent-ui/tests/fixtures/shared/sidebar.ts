import type { SidebarOptions } from "@kind-ui/agent-ui/core";

export const chats = ["Release checklist", "Flaky login test", "Pricing page copy", "Q3 roadmap"];

// A cookie, as the docs recommend, so a server could render the saved width.
export const cookieStorage: NonNullable<SidebarOptions["storage"]> = {
  getItem: (key) => {
    const value = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))?.[1];
    return value === undefined ? null : decodeURIComponent(value);
  },
  setItem: (key, value) => {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/`;
  },
};

export function sidebarHost() {
  const changes: { open: boolean; reason: string; source?: string }[] = [];
  return {
    host: { changes },
    change: (open: boolean, details: { reason: string; source?: string }) =>
      changes.push({ open, reason: details.reason, source: details.source }),
  };
}
