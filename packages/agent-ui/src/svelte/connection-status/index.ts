import type { ComponentProps } from "svelte";
import ConnectionStatus from "./ConnectionStatus.svelte";
import ConnectionStatusRetry from "./ConnectionStatusRetry.svelte";
import ConnectionStatusText from "./ConnectionStatusText.svelte";
import { parts } from "./parts.js";

/** The bare root, for arranging the parts yourself. */
export const ConnectionStatusRoot = parts.Root;
export const ConnectionStatusMark = parts.Mark;

export { ConnectionStatus, ConnectionStatusRetry, ConnectionStatusText };
export type ConnectionStatusProps = ComponentProps<typeof ConnectionStatus>;
export type ConnectionStatusTextProps = ComponentProps<typeof ConnectionStatusText>;
export type ConnectionStatusRetryProps = ComponentProps<typeof ConnectionStatusRetry>;
