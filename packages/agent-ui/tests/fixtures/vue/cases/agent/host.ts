import { agentDrafts, agentHost } from "../../../shared/agent.js";
import { dictationHost } from "../../../shared/dictation.js";

export const drafts = agentDrafts();
export const host = agentHost();
export const dictation = dictationHost();

export type Details = { source: string; cancel(): void };
