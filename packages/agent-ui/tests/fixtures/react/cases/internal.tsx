import { useState } from "react";
import { KindAvatar, KindAvatarFallback, KindAvatarImage } from "../../../../src/react/internal/avatar.js";
import { KindButton } from "../../../../src/react/internal/button.js";
import {
  KindCollapsible,
  KindCollapsiblePanel,
  KindCollapsibleTrigger,
} from "../../../../src/react/internal/collapsible.js";
import {
  KindFileInput,
  KindFileInputDropzone,
  KindFileInputItem,
  KindFileInputItemRemove,
  KindFileInputList,
  KindFileInputTrigger,
} from "../../../../src/react/internal/file-input.js";
import {
  KindMenu,
  KindMenuContent,
  KindMenuItem,
  KindMenuSeparator,
  KindMenuTrigger,
} from "../../../../src/react/internal/menu.js";
import {
  KindProgress,
  KindProgressIndicator,
  KindProgressLabel,
  KindProgressTrack,
  KindProgressValue,
} from "../../../../src/react/internal/progress.js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "../../../../src/react/internal/scroll-area.js";
import { KindToggle } from "../../../../src/react/internal/toggle.js";
import {
  KindTokenInput,
  KindTokenInputEditor,
  KindTokenInputToken,
  KindTokenInputTokenRemove,
} from "../../../../src/react/internal/token-input.js";
import {
  KindToolbar,
  KindToolbarButton,
  KindToolbarSeparator,
} from "../../../../src/react/internal/toolbar.js";
import {
  KindTriggerMenu,
  KindTriggerMenuContent,
  KindTriggerMenuInput,
  KindTriggerMenuItem,
  KindTriggerMenuList,
} from "../../../../src/react/internal/trigger-menu.js";

const avatarSrc = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')}`;
const lines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`);

function ButtonCase() {
  const [presses, setPresses] = useState(0);
  return (
    <>
      <KindButton onClick={() => setPresses((n) => n + 1)}>Save</KindButton>
      <output>Pressed {presses}</output>
    </>
  );
}

export const cases = {
  button: () => <ButtonCase />,
  collapsible: () => (
    <KindCollapsible>
      <KindCollapsibleTrigger>Details</KindCollapsibleTrigger>
      <KindCollapsiblePanel>Hidden details</KindCollapsiblePanel>
    </KindCollapsible>
  ),
  "scroll-area": () => (
    <KindScrollArea className="h-24 w-48">
      <KindScrollAreaViewport aria-label="Log" role="region">
        <KindScrollAreaContent>
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </KindScrollAreaContent>
      </KindScrollAreaViewport>
      <KindScrollAreaScrollbar orientation="vertical">
        <KindScrollAreaThumb />
      </KindScrollAreaScrollbar>
    </KindScrollArea>
  ),
  toolbar: () => (
    <KindToolbar aria-label="Formatting">
      <KindToolbarButton>Undo</KindToolbarButton>
      <KindToolbarButton>Redo</KindToolbarButton>
      <KindToolbarSeparator />
      <KindToolbarButton>Copy</KindToolbarButton>
    </KindToolbar>
  ),
  toggle: () => <KindToggle>Bold</KindToggle>,
  menu: () => (
    <KindMenu>
      <KindMenuTrigger>Actions</KindMenuTrigger>
      <KindMenuContent>
        <KindMenuItem value="rename">Rename</KindMenuItem>
        <KindMenuItem value="duplicate">Duplicate</KindMenuItem>
        <KindMenuSeparator />
        <KindMenuItem value="delete">Delete</KindMenuItem>
      </KindMenuContent>
    </KindMenu>
  ),
  avatar: () => (
    <KindAvatar>
      <KindAvatarImage alt="Ada Lovelace" src={avatarSrc} />
      <KindAvatarFallback>AL</KindAvatarFallback>
    </KindAvatar>
  ),
  "token-input": () => (
    <KindTokenInput
      defaultValue={["Explain ", { type: "file", value: "src/a.ts", label: "a.ts" }]}
      renderToken={(token) => (
        <KindTokenInputToken>
          {token.label}
          <KindTokenInputTokenRemove>×</KindTokenInputTokenRemove>
        </KindTokenInputToken>
      )}
      tokenDeletion="whole"
    >
      <KindTokenInputEditor aria-label="Prompt" />
    </KindTokenInput>
  ),
  "trigger-menu": () => (
    <KindTriggerMenu triggers={[{ char: "@" }]}>
      <KindTriggerMenuInput aria-label="Message" />
      <KindTriggerMenuContent>
        <KindTriggerMenuList>
          <KindTriggerMenuItem label="Hollis Grant" value="hollis">
            Hollis Grant
          </KindTriggerMenuItem>
          <KindTriggerMenuItem label="Inès Moreau" value="ines">
            Inès Moreau
          </KindTriggerMenuItem>
        </KindTriggerMenuList>
      </KindTriggerMenuContent>
    </KindTriggerMenu>
  ),
  "file-input": () => (
    <KindFileInput multiple>
      <KindFileInputDropzone>
        <p>Drop files here</p>
        <KindFileInputTrigger>Attach files</KindFileInputTrigger>
      </KindFileInputDropzone>
      <KindFileInputList aria-label="Files">
        <KindFileInputItem>
          {({ file }) => (
            <>
              <span>{file.name}</span>
              <KindFileInputItemRemove>×</KindFileInputItemRemove>
            </>
          )}
        </KindFileInputItem>
      </KindFileInputList>
    </KindFileInput>
  ),
  progress: () => (
    <KindProgress value={40}>
      <KindProgressLabel>Uploading</KindProgressLabel>
      <KindProgressValue />
      <KindProgressTrack>
        <KindProgressIndicator />
      </KindProgressTrack>
    </KindProgress>
  ),
};
