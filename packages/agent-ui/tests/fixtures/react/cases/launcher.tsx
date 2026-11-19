import type { MotionMode } from "@kind-ui/agent-ui/core";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/react/composer.js";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { Launcher } from "../../../../src/react/launcher.js";
import { launcherHost, messages } from "../../shared/launcher.js";

const { record, click } = launcherHost();

function Page({ unread, modal, motion }: { unread?: number; modal?: boolean; motion?: MotionMode }) {
  return (
    <div className="p-6">
      <button id="page-button" type="button" onClick={click}>
        Page button
      </button>
      <Launcher id="launcher" unread={unread} modal={modal} motion={motion} onOpenChange={record}>
        <Conversation aria-label="Chat" messageCount={messages.length} className="h-48">
          <ConversationViewport>
            <ConversationContent>
              {messages.map((message, index) => (
                <ConversationRow key={message.id} value={message.id} index={index}>
                  <p data-message={message.id}>{message.text}</p>
                </ConversationRow>
              ))}
            </ConversationContent>
          </ConversationViewport>
        </Conversation>
        <Composer aria-label="Message" onSubmit={() => undefined}>
          <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
          <ComposerSubmit />
        </Composer>
      </Launcher>
    </div>
  );
}

export const cases = {
  all: () => <Page unread={2} />,
  modal: () => <Page unread={2} modal />,
  read: () => <Page />,
  reduced: () => <Page unread={2} motion="reduced" />,
};
