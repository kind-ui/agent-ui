<script lang="ts">
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
] as const;
</script>

<script setup lang="ts">
import { ref } from "vue";
import { KindAvatar, KindAvatarFallback, KindAvatarImage } from "../../../../src/vue/internal/avatar.js";
import { KindButton } from "../../../../src/vue/internal/button.js";
import {
  KindCollapsible,
  KindCollapsiblePanel,
  KindCollapsibleTrigger,
} from "../../../../src/vue/internal/collapsible.js";
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
} from "../../../../src/vue/internal/command.js";
import {
  KindFileInput,
  KindFileInputDropzone,
  KindFileInputItem,
  KindFileInputItemRemove,
  KindFileInputList,
  KindFileInputTrigger,
} from "../../../../src/vue/internal/file-input.js";
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
} from "../../../../src/vue/internal/menu.js";
import {
  KindProgress,
  KindProgressIndicator,
  KindProgressLabel,
  KindProgressTrack,
  KindProgressValue,
} from "../../../../src/vue/internal/progress.js";
import {
  KindScrollArea,
  KindScrollAreaContent,
  KindScrollAreaScrollbar,
  KindScrollAreaThumb,
  KindScrollAreaViewport,
} from "../../../../src/vue/internal/scroll-area.js";
import {
  KindSlider,
  KindSliderControl,
  KindSliderIndicator,
  KindSliderThumb,
  KindSliderTrack,
  KindSliderValue,
} from "../../../../src/vue/internal/slider.js";
import { KindSwitch, KindSwitchThumb } from "../../../../src/vue/internal/switch.js";
import { KindToggle } from "../../../../src/vue/internal/toggle.js";
import {
  KindTokenInput,
  KindTokenInputEditor,
  KindTokenInputToken,
  KindTokenInputTokenRemove,
} from "../../../../src/vue/internal/token-input.js";
import { KindToolbar, KindToolbarButton, KindToolbarSeparator } from "../../../../src/vue/internal/toolbar.js";
import {
  KindTriggerMenu,
  KindTriggerMenuContent,
  KindTriggerMenuInput,
  KindTriggerMenuItem,
  KindTriggerMenuList,
} from "../../../../src/vue/internal/trigger-menu.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const avatarSrc = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')}`;
const lines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`);
const presses = ref(0);
</script>

<template>
  <template v-if="variant === 'button'">
    <KindButton @click="presses++">Save</KindButton>
    <output>Pressed {{ presses }}</output>
  </template>
  <KindCollapsible v-else-if="variant === 'collapsible'">
    <KindCollapsibleTrigger>Details</KindCollapsibleTrigger>
    <KindCollapsiblePanel>Hidden details</KindCollapsiblePanel>
  </KindCollapsible>
  <KindScrollArea v-else-if="variant === 'scroll-area'" class="h-24 w-48">
    <KindScrollAreaViewport aria-label="Log" role="region">
      <KindScrollAreaContent>
        <p v-for="line in lines" :key="line">{{ line }}</p>
      </KindScrollAreaContent>
    </KindScrollAreaViewport>
    <KindScrollAreaScrollbar orientation="vertical">
      <KindScrollAreaThumb />
    </KindScrollAreaScrollbar>
  </KindScrollArea>
  <KindToolbar v-else-if="variant === 'toolbar'" aria-label="Formatting">
    <KindToolbarButton>Undo</KindToolbarButton>
    <KindToolbarButton>Redo</KindToolbarButton>
    <KindToolbarSeparator />
    <KindToolbarButton>Copy</KindToolbarButton>
  </KindToolbar>
  <KindToolbar v-else-if="variant === 'toolbar-menu'" aria-label="Sharing">
    <KindMenu>
      <KindToolbarButton>
        <template #render="{ props, children }">
          <KindMenuTrigger v-bind="props">
            <template #render="{ props: trigger, children: label }">
              <KindButton v-bind="trigger"><component :is="label" /></KindButton>
            </template>
            <component :is="children" />
          </KindMenuTrigger>
        </template>
        Share
      </KindToolbarButton>
      <KindMenuContent>
        <KindMenuItem value="link">Copy link</KindMenuItem>
      </KindMenuContent>
    </KindMenu>
    <KindMenu>
      <KindToolbarButton>
        <template #render="{ props, children }">
          <KindMenuTrigger v-bind="props"><component :is="children" /></KindMenuTrigger>
        </template>
        Export
      </KindToolbarButton>
      <KindMenuContent>
        <KindMenuItem value="pdf">PDF</KindMenuItem>
      </KindMenuContent>
    </KindMenu>
  </KindToolbar>
  <KindToggle v-else-if="variant === 'toggle'">Bold</KindToggle>
  <KindMenu v-else-if="variant === 'menu'">
    <KindMenuTrigger>Actions</KindMenuTrigger>
    <KindMenuContent>
      <KindMenuItem value="rename">Rename</KindMenuItem>
      <KindMenuItem value="duplicate">Duplicate</KindMenuItem>
      <KindMenuSeparator />
      <KindMenuItem value="delete">Delete</KindMenuItem>
    </KindMenuContent>
  </KindMenu>
  <KindAvatar v-else-if="variant === 'avatar'">
    <KindAvatarImage alt="Ada Lovelace" :src="avatarSrc" />
    <KindAvatarFallback>AL</KindAvatarFallback>
  </KindAvatar>
  <KindTokenInput
    v-else-if="variant === 'token-input'"
    :default-value="['Explain ', { type: 'file', value: 'src/a.ts', label: 'a.ts' }]"
    token-deletion="whole"
  >
    <KindTokenInputEditor aria-label="Prompt" />
    <template #token="{ token }">
      <KindTokenInputToken>
        {{ token.label }}
        <KindTokenInputTokenRemove>×</KindTokenInputTokenRemove>
      </KindTokenInputToken>
    </template>
  </KindTokenInput>
  <KindTriggerMenu v-else-if="variant === 'trigger-menu'" :triggers="[{ char: '@' }]">
    <KindTriggerMenuInput aria-label="Message" />
    <KindTriggerMenuContent>
      <KindTriggerMenuList>
        <KindTriggerMenuItem label="Hollis Grant" value="hollis">Hollis Grant</KindTriggerMenuItem>
        <KindTriggerMenuItem label="Inès Moreau" value="ines">Inès Moreau</KindTriggerMenuItem>
      </KindTriggerMenuList>
    </KindTriggerMenuContent>
  </KindTriggerMenu>
  <KindFileInput v-else-if="variant === 'file-input'" multiple>
    <KindFileInputDropzone>
      <p>Drop files here</p>
      <KindFileInputTrigger>Attach files</KindFileInputTrigger>
    </KindFileInputDropzone>
    <KindFileInputList aria-label="Files">
      <KindFileInputItem v-slot="{ state }">
        <span>{{ state.file.name }}</span>
        <KindFileInputItemRemove>×</KindFileInputItemRemove>
      </KindFileInputItem>
    </KindFileInputList>
  </KindFileInput>
  <KindProgress v-else-if="variant === 'progress'" :value="40">
    <KindProgressLabel>Uploading</KindProgressLabel>
    <KindProgressValue />
    <KindProgressTrack>
      <KindProgressIndicator />
    </KindProgressTrack>
  </KindProgress>
  <KindCommand v-else-if="variant === 'command'">
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
  <KindSlider v-else-if="variant === 'slider'" :default-value="40">
    <KindSliderValue />
    <KindSliderControl>
      <KindSliderTrack>
        <KindSliderIndicator />
        <KindSliderThumb aria-label="Volume" />
      </KindSliderTrack>
    </KindSliderControl>
  </KindSlider>
  <KindSwitch v-else-if="variant === 'switch'" aria-label="Notifications">
    <KindSwitchThumb />
  </KindSwitch>
  <KindMenu v-else-if="variant === 'menu-data'">
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
          <KindMenuItemIndicator keep-mounted>✓</KindMenuItemIndicator>
          Word wrap
        </KindMenuCheckboxItem>
      </KindMenuGroup>
      <KindMenuSeparator />
      <KindMenuRadioGroup default-value="comfortable">
        <KindMenuGroupLabel>Density</KindMenuGroupLabel>
        <KindMenuRadioItem value="compact">
          <KindMenuItemIndicator keep-mounted>•</KindMenuItemIndicator>
          Compact
        </KindMenuRadioItem>
        <KindMenuRadioItem value="comfortable">
          <KindMenuItemIndicator keep-mounted>•</KindMenuItemIndicator>
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
</template>
