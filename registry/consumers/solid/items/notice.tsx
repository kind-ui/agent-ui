import { Notice } from "../components/ui/solid/notice.js";

export default function NoticeItem() {
  return (
    <Notice variant="warning" label="Rate limited" onDismiss={() => {}}>
      Responses are slower for the next few minutes.
    </Notice>
  );
}
