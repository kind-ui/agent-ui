import { createSignal, For } from "solid-js";
import { KindAvatar, KindAvatarFallback, KindAvatarImage } from "../../../../src/solid/internal/avatar.js";
import { KindButton } from "../../../../src/solid/internal/button.js";
import {
  KindCollapsible,
  KindCollapsiblePanel,
  KindCollapsibleTrigger,
} from "../../../../src/solid/internal/collapsible.js";
import {
  KindCommand,
  KindCommandEmpty,
  KindCommandGroup,
  KindCommandGroupLabel,
  KindCommandInput,
  KindCommandItem,
  KindCommandItemIcon,
  KindCommandItemText,
  KindCommandList,
} from "../../../../src/solid/internal/command.js";
import {
  KindFileInput,
  KindFileInputDropzone,
  KindFileInputItem,
  KindFileInputItemRemove,
  KindFileInputList,
  KindFileInputTrigger,
} from "../../../../src/solid/internal/file-input.js";
import {
  KindMenu,
  KindMenuCheckboxItem,
  KindMenuContent,
  KindMenuGroup,
  KindMenuGroupLabel,
  KindMenuItem,
  KindMenuItemIcon,
  KindMenuItemIndicator,
  KindMenuRadioGroup,
  KindMenuRadioItem,
  KindMenuSeparator,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
  KindMenuTrigger,
} from "../../../../src/solid/internal/menu.js";
import {
  KindProgress,
  KindProgressIndicator,
  KindProgressLabel,
  KindProgressTrack,
  KindProgressValue,
} from "../../../../src/solid/internal/progress.js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "../../../../src/solid/internal/scroll-area.js";
import {
  KindSlider,
  KindSliderControl,
  KindSliderIndicator,
  KindSliderThumb,
  KindSliderTrack,
  KindSliderValue,
} from "../../../../src/solid/internal/slider.js";
import { KindSwitch, KindSwitchThumb } from "../../../../src/solid/internal/switch.js";
import { KindToggle } from "../../../../src/solid/internal/toggle.js";
import {
  KindTokenInput,
  KindTokenInputEditor,
  KindTokenInputToken,
  KindTokenInputTokenRemove,
} from "../../../../src/solid/internal/token-input.js";
import {
  KindToolbar,
  KindToolbarButton,
  KindToolbarSeparator,
} from "../../../../src/solid/internal/toolbar.js";
import {
  KindTriggerMenu,
  KindTriggerMenuContent,
  KindTriggerMenuInput,
  KindTriggerMenuItem,
  KindTriggerMenuList,
} from "../../../../src/solid/internal/trigger-menu.js";

const avatarSrc = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')}`;
const lines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`);

function ButtonCase() {
  const [presses, setPresses] = createSignal(0);
  return (
    <>
      <KindButton onClick={() => setPresses((n) => n + 1)}>Save</KindButton>
      <output>Pressed {presses()}</output>
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
    <KindScrollArea class="h-24 w-48">
      <KindScrollAreaViewport aria-label="Log" role="region">
        <KindScrollAreaContent>
          <For each={lines}>{(line) => <p>{line}</p>}</For>
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
  "toolbar-menu": () => (
    <KindToolbar aria-label="Sharing">
      <KindMenu>
        <KindToolbarButton render={(props) => <KindMenuTrigger {...props} render={KindButton} />}>
          Share
        </KindToolbarButton>
        <KindMenuContent>
          <KindMenuItem value="link">Copy link</KindMenuItem>
        </KindMenuContent>
      </KindMenu>
      <KindMenu>
        <KindToolbarButton render={(props) => <KindMenuTrigger {...props} />}>Export</KindToolbarButton>
        <KindMenuContent>
          <KindMenuItem value="pdf">PDF</KindMenuItem>
        </KindMenuContent>
      </KindMenu>
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
          {(state) => (
            <>
              <span>{state.file.name}</span>
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
  command: () => (
    <KindCommand>
      <KindCommandInput aria-label="Search commands" placeholder="Search" />
      <KindCommandEmpty>No commands found</KindCommandEmpty>
      <KindCommandList>
        <KindCommandGroup>
          <KindCommandGroupLabel>Files</KindCommandGroupLabel>
          <KindCommandItem value="new-file">
            <KindCommandItemIcon>+</KindCommandItemIcon>
            <KindCommandItemText>New file</KindCommandItemText>
          </KindCommandItem>
          <KindCommandItem value="open-recent">
            <KindCommandItemText>Open recent</KindCommandItemText>
          </KindCommandItem>
          <KindCommandItem value="rename">
            <KindCommandItemText>Rename</KindCommandItemText>
          </KindCommandItem>
        </KindCommandGroup>
      </KindCommandList>
    </KindCommand>
  ),
  slider: () => (
    <KindSlider defaultValue={40}>
      <KindSliderValue />
      <KindSliderControl>
        <KindSliderTrack>
          <KindSliderIndicator />
          <KindSliderThumb aria-label="Volume" />
        </KindSliderTrack>
      </KindSliderControl>
    </KindSlider>
  ),
  switch: () => (
    <KindSwitch aria-label="Notifications">
      <KindSwitchThumb />
    </KindSwitch>
  ),
  "menu-data": () => (
    <KindMenu>
      <KindMenuTrigger>Settings</KindMenuTrigger>
      <KindMenuContent>
        <KindMenuGroup>
          <KindMenuGroupLabel>View</KindMenuGroupLabel>
          <KindMenuItem value="archive">
            <KindMenuItemIcon>▣</KindMenuItemIcon>
            <span data-menu-text="true">
              <span>Archive</span>
              <span data-menu-description="true">Hide it from the list</span>
            </span>
          </KindMenuItem>
          <KindMenuCheckboxItem value="wrap">
            <KindMenuItemIndicator keepMounted>✓</KindMenuItemIndicator>
            Word wrap
          </KindMenuCheckboxItem>
        </KindMenuGroup>
        <KindMenuSeparator />
        <KindMenuRadioGroup defaultValue="comfortable">
          <KindMenuGroupLabel>Density</KindMenuGroupLabel>
          <KindMenuRadioItem value="compact">
            <KindMenuItemIndicator keepMounted>•</KindMenuItemIndicator>
            Compact
          </KindMenuRadioItem>
          <KindMenuRadioItem value="comfortable">
            <KindMenuItemIndicator keepMounted>•</KindMenuItemIndicator>
            Comfortable
          </KindMenuRadioItem>
        </KindMenuRadioGroup>
        <KindMenuSeparator />
        <KindMenuSub>
          <KindMenuSubTrigger>Move to</KindMenuSubTrigger>
          <KindMenuSubContent>
            <KindMenuItem value="inbox">Inbox</KindMenuItem>
          </KindMenuSubContent>
        </KindMenuSub>
        <KindMenuItem value="delete" destructive>
          Delete
        </KindMenuItem>
      </KindMenuContent>
    </KindMenu>
  ),
};
