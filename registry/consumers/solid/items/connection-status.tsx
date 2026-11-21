import { ConnectionStatus } from "../components/ui/solid/connection-status.js";

export default function ConnectionStatusItem() {
  return <ConnectionStatus state="offline" onRetry={() => {}} />;
}
