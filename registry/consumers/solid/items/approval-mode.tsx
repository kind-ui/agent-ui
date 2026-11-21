import { ApprovalMode } from "../components/ui/solid/approval-mode.js";

export default function ApprovalModeItem() {
  return (
    <ApprovalMode
      defaultValue="ask"
      modes={[
        { value: "ask", label: "Ask first" },
        { value: "auto", label: "Auto", danger: true },
      ]}
    />
  );
}
