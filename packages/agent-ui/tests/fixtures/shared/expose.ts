export function expose(handles: Record<string, unknown>) {
  if (typeof window !== "undefined") Object.assign(window, handles);
}
