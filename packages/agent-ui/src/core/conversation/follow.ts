export interface FollowState {
  following: boolean;
  /** Messages added while not following, less any removed since. */
  newCount: number;
  count: number;
}

export type FollowEvent = { type: "count"; count: number } | { type: "following"; following: boolean };

/** Spec §2 exception "Conversation new-message counter". `following` events come only from `createStickToBottom`. */
export function nextFollowState(prev: FollowState, event: FollowEvent): FollowState {
  if (event.type === "following") {
    return event.following ? { ...prev, following: true, newCount: 0 } : { ...prev, following: false };
  }
  if (prev.following) return { ...prev, count: event.count };
  return { ...prev, count: event.count, newCount: Math.max(0, prev.newCount + event.count - prev.count) };
}
