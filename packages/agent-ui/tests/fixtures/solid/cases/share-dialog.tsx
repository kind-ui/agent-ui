import type { MotionMode, ShareVisibility } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { ShareDialog } from "../../../../src/solid/share-dialog.js";
import { expose } from "../../shared/expose.js";
import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

const { host, call, answer } = shareDialogHost();

function Page(props: { linked?: boolean; agentConfirm?: boolean; motion?: MotionMode; refusing?: boolean }) {
  const [visibility, setVisibility] = createSignal<ShareVisibility>(props.linked ? "link" : "private");
  const [link, setLink] = createSignal<string | undefined>(props.linked ? shareLink : undefined);
  onSettled(() => {
    answer((action) => {
      if (action === "create") return void setLink(shareLink);
      setLink(undefined);
      setVisibility("private");
    });
    expose({ kindHost: host });
  });
  return (
    <div class="w-[30rem] p-6">
      <ShareDialog
        id="share"
        visibility={visibility()}
        onVisibilityChange={(value, details) => {
          host.visibilities.push({ value, reason: details.reason, source: details.source });
          if (!props.refusing) setVisibility(value);
        }}
        link={link()}
        onCreateLink={(details) => call("create", details)}
        onRevoke={(details) => call("revoke", details)}
        onCopy={(value, details) => host.copies.push({ link: value, reason: details.reason })}
        agentConfirm={props.agentConfirm}
        motion={props.motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  linked: () => <Page linked />,
  unconfirmed: () => <Page agentConfirm={false} />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
};
