import { GuardrailNotice } from "../components/ui/solid/guardrail-notice.js";

export default function GuardrailNoticeItem() {
  return (
    <GuardrailNotice
      blocking
      label="Model output withheld"
      reason="The response included personal data."
      detail="Policy."
    />
  );
}
