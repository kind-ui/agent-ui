import type { MotionMode, ShareVisibility } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { ShareDialog } from "../../../../src/react/share-dialog.js";
import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

const { host, call, answer } = shareDialogHost();

function Page({
  linked = false,
  agentConfirm,
  motion,
}: {
  linked?: boolean;
  agentConfirm?: boolean;
  motion?: MotionMode;
}) {
  const [visibility, setVisibility] = useState<ShareVisibility>(linked ? "link" : "private");
  const [link, setLink] = useState<string | undefined>(linked ? shareLink : undefined);
  useEffect(() => {
    answer((action) => {
      if (action === "create") return setLink(shareLink);
      setLink(undefined);
      setVisibility("private");
    });
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="w-[30rem] p-6">
      <ShareDialog
        id="share"
        visibility={visibility}
        onVisibilityChange={(value, details) => {
          host.visibilities.push({ value, reason: details.reason, source: details.source });
          setVisibility(value);
        }}
        link={link}
        onCreateLink={(details) => call("create", details)}
        onRevoke={(details) => call("revoke", details)}
        onCopy={(value, details) => host.copies.push({ link: value, reason: details.reason })}
        agentConfirm={agentConfirm}
        motion={motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  linked: () => <Page linked />,
  unconfirmed: () => <Page agentConfirm={false} />,
  reduced: () => <Page motion="reduced" />,
};
