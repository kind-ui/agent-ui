import { h } from "vue";
import { ConnectionStatus } from "../components/ui/vue/connection-status.js";

export default () => h(ConnectionStatus, { state: "offline", onRetry: () => {} });
