import { QuotaNotice } from "../components/ui/solid/quota-notice.js";

export default function QuotaNoticeItem() {
  return <QuotaNotice used={800} limit={1000} period="this month" />;
}
