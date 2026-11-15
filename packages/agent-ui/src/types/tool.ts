export interface ToolCall {
  toolCallId: string;
  name: string;
  dynamic: boolean;
  input: { state: "streaming" | "ready"; value: unknown };
  // Output presence is decided by this field existing, never by value truthiness.
  output?: { state: "available" | "preliminary"; value: unknown };
  outcome?: "error" | "denied" | "cancelled";
  approval?: Approval;
}

export interface Approval {
  approvalId: string;
  // Increments when the host replaces a request.
  generation: number;
  state: "requested" | "submitting" | "submit-failed" | "responded" | "auto";
  decision?: { approved: boolean; reason?: string };
}
