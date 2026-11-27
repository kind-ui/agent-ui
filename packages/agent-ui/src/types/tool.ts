export interface ToolCall {
  toolCallId: string;
  name: string;
  /** The call in words, like "Read `sign-in.ts`", shown in place of its name. */
  title?: string;
  dynamic: boolean;
  input: { state: "streaming" | "ready"; value: unknown };
  /** Present once there is output; `0`, `false`, `""` and `null` are valid values. */
  output?: { state: "available" | "preliminary"; value: unknown };
  outcome?: "error" | "denied" | "cancelled";
  approval?: Approval;
}

export interface Approval {
  approvalId: string;
  /** Increments when the host replaces a request. */
  generation: number;
  /** `expired`: the deadline passed before a decision. `cancelled`: the request was withdrawn before one. */
  state: "requested" | "submitting" | "submit-failed" | "responded" | "auto" | "expired" | "cancelled";
  /**
   * The recorded decision. `always` says it was Always allow, and `scope` where it reaches, like "in this project",
   * in the words the outcome shows.
   */
  decision?: { approved: boolean; reason?: string; always?: boolean; scope?: string };
  /** ISO 8601: when the request expires. Shows "Decide in 4 min"; past it, "Expired" until the host resolves it. */
  expiresAt?: string;
}
