<script module lang="ts">
  export const variants = [
    "button",
    "collapsible",
    "scroll-area",
    "toolbar",
    "toolbar-menu",
    "toggle",
    "menu",
    "avatar",
    "token-input",
    "trigger-menu",
    "file-input",
    "progress",
    "command",
    "slider",
    "switch",
    "menu-data",
  ];
</script>

<script lang="ts">
  import { KindAvatar, KindAvatarFallback, KindAvatarImage } from "../../../../src/svelte/internal/avatar/index.js";
  import { KindButton } from "../../../../src/svelte/internal/button/index.js";
  import {
    KindCollapsible,
    KindCollapsiblePanel,
    KindCollapsibleTrigger,
  } from "../../../../src/svelte/internal/collapsible/index.js";
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
  } from "../../../../src/svelte/internal/command/index.js";
  import {
    KindFileInput,
    KindFileInputDropzone,
    KindFileInputItem,
    KindFileInputItemRemove,
    KindFileInputList,
    KindFileInputTrigger,
  } from "../../../../src/svelte/internal/file-input/index.js";
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
  } from "../../../../src/svelte/internal/menu/index.js";
  import {
    KindProgress,
    KindProgressIndicator,
    KindProgressLabel,
    KindProgressTrack,
    KindProgressValue,
  } from "../../../../src/svelte/internal/progress/index.js";
  import {
    KindScrollArea,
    KindScrollAreaContent,
    KindScrollAreaScrollbar,
    KindScrollAreaThumb,
    KindScrollAreaViewport,
  } from "../../../../src/svelte/internal/scroll-area/index.js";
  import {
    KindSlider,
    KindSliderControl,
    KindSliderIndicator,
    KindSliderThumb,
    KindSliderTrack,
    KindSliderValue,
  } from "../../../../src/svelte/internal/slider/index.js";
  import { KindSwitch, KindSwitchThumb } from "../../../../src/svelte/internal/switch/index.js";
  import { KindToggle } from "../../../../src/svelte/internal/toggle/index.js";
  import {
    KindTokenInput,
    KindTokenInputEditor,
    KindTokenInputToken,
    KindTokenInputTokenRemove,
  } from "../../../../src/svelte/internal/token-input/index.js";
  import {
    KindToolbar,
    KindToolbarButton,
    KindToolbarSeparator,
  } from "../../../../src/svelte/internal/toolbar/index.js";
  import {
    KindTriggerMenu,
    KindTriggerMenuContent,
    KindTriggerMenuInput,
    KindTriggerMenuItem,
    KindTriggerMenuList,
  } from "../../../../src/svelte/internal/trigger-menu/index.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const avatarSrc = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')}`;
  const lines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`);
  let presses = $state(0);
</script>

{#if variant === "button"}
  <KindButton onclick={() => presses++}>Save</KindButton>
  {#snippet count()}{presses}{/snippet}
  <output>Pressed {@render count()}</output>
{:else if variant === "collapsible"}
  <KindCollapsible>
    <KindCollapsibleTrigger>Details</KindCollapsibleTrigger>
    <KindCollapsiblePanel>Hidden details</KindCollapsiblePanel>
  </KindCollapsible>
{:else if variant === "scroll-area"}
  <KindScrollArea class="h-24 w-48">
    <KindScrollAreaViewport aria-label="Log" role="region">
      <KindScrollAreaContent>
        {#each lines as line (line)}
          <p>{line}</p>
        {/each}
      </KindScrollAreaContent>
    </KindScrollAreaViewport>
    <KindScrollAreaScrollbar orientation="vertical">
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
  </KindScrollArea>
{:else if variant === "toolbar"}
  <KindToolbar aria-label="Formatting">
    <KindToolbarButton>Undo</KindToolbarButton>
    <KindToolbarButton>Redo</KindToolbarButton>
    <KindToolbarSeparator />
    <KindToolbarButton>Copy</KindToolbarButton>
  </KindToolbar>
{:else if variant === "toolbar-menu"}
  <KindToolbar aria-label="Sharing">
    <KindMenu>
      <KindToolbarButton>
        {#snippet render({ props })}
          <KindMenuTrigger {...props}>
            {#snippet render({ props })}
              <KindButton {...props}>Share</KindButton>
            {/snippet}
          </KindMenuTrigger>
        {/snippet}
      </KindToolbarButton>
      <KindMenuContent>
        <KindMenuItem value="link">Copy link</KindMenuItem>
      </KindMenuContent>
    </KindMenu>
    <KindMenu>
      <KindToolbarButton>
        {#snippet render({ props })}
          <KindMenuTrigger {...props}>Export</KindMenuTrigger>
        {/snippet}
      </KindToolbarButton>
      <KindMenuContent>
        <KindMenuItem value="pdf">PDF</KindMenuItem>
      </KindMenuContent>
    </KindMenu>
  </KindToolbar>
{:else if variant === "toggle"}
  <KindToggle>Bold</KindToggle>
{:else if variant === "menu"}
  <KindMenu>
    <KindMenuTrigger>Actions</KindMenuTrigger>
    <KindMenuContent>
      <KindMenuItem value="rename">Rename</KindMenuItem>
      <KindMenuItem value="duplicate">Duplicate</KindMenuItem>
      <KindMenuSeparator />
      <KindMenuItem value="delete">Delete</KindMenuItem>
    </KindMenuContent>
  </KindMenu>
{:else if variant === "avatar"}
  <KindAvatar>
    <KindAvatarImage alt="Ada Lovelace" src={avatarSrc} />
    <KindAvatarFallback>AL</KindAvatarFallback>
  </KindAvatar>
{:else if variant === "token-input"}
  <KindTokenInput
    defaultValue={["Explain ", { type: "file", value: "src/a.ts", label: "a.ts" }]}
    tokenDeletion="whole"
  >
    {#snippet token(token)}
      <KindTokenInputToken>
        {token.label}
        <KindTokenInputTokenRemove>×</KindTokenInputTokenRemove>
      </KindTokenInputToken>
    {/snippet}
    <KindTokenInputEditor aria-label="Prompt" />
  </KindTokenInput>
{:else if variant === "trigger-menu"}
  <KindTriggerMenu triggers={[{ char: "@" }]}>
    <KindTriggerMenuInput aria-label="Message" />
    <KindTriggerMenuContent>
      <KindTriggerMenuList>
        <KindTriggerMenuItem label="Hollis Grant" value="hollis">Hollis Grant</KindTriggerMenuItem>
        <KindTriggerMenuItem label="Inès Moreau" value="ines">Inès Moreau</KindTriggerMenuItem>
      </KindTriggerMenuList>
    </KindTriggerMenuContent>
  </KindTriggerMenu>
{:else if variant === "file-input"}
  <KindFileInput multiple>
    <KindFileInputDropzone>
      <p>Drop files here</p>
      <KindFileInputTrigger>Attach files</KindFileInputTrigger>
    </KindFileInputDropzone>
    <KindFileInputList aria-label="Files">
      <KindFileInputItem>
        {#snippet children({ file })}
          <span>{file.name}</span>
          <KindFileInputItemRemove>×</KindFileInputItemRemove>
        {/snippet}
      </KindFileInputItem>
    </KindFileInputList>
  </KindFileInput>
{:else if variant === "progress"}
  <KindProgress value={40}>
    <KindProgressLabel>Uploading</KindProgressLabel>
    <KindProgressValue />
    <KindProgressTrack>
      <KindProgressIndicator />
    </KindProgressTrack>
  </KindProgress>
{:else if variant === "command"}
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
{:else if variant === "slider"}
  <KindSlider defaultValue={40}>
    <KindSliderValue />
    <KindSliderControl>
      <KindSliderTrack>
        <KindSliderIndicator />
        <KindSliderThumb aria-label="Volume" />
      </KindSliderTrack>
    </KindSliderControl>
  </KindSlider>
{:else if variant === "switch"}
  <KindSwitch aria-label="Notifications">
    <KindSwitchThumb />
  </KindSwitch>
{:else if variant === "menu-data"}
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
      <KindMenuItem value="delete" destructive>Delete</KindMenuItem>
    </KindMenuContent>
  </KindMenu>
{/if}
