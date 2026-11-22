<!-- UI SDK Command: the search field, the empty text, and every page of rows unless you pass children. -->
<script lang="ts">
  import type { PickerCommandState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import {
    KindCommand,
    KindCommandEmpty,
    KindCommandInput,
    KindCommandList,
    KindCommandPage,
    KindCommandStatus,
  } from "../internal/command/index.js";
  import PickerSectionRows from "./PickerSectionRows.svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  type Props = ComponentProps<PickerParts["Command"]> & {
    /** What sits in the list, from the rows: every page by default. */
    children?: Snippet<[PickerCommandState]>;
  };

  let { children: rows, ...props }: Props = $props();
  const { parts } = pickerConfig();
</script>

<parts.Command {...props}>
  {#snippet children(state: PickerCommandState)}
    <KindCommand {...state.props}>
      <KindCommandInput aria-label={state.label} placeholder={state.placeholder} data-agent-hidden=""
      />{#if state.statusText !== undefined}<KindCommandStatus>{state.statusText}</KindCommandStatus>{/if}<KindCommandEmpty
      >{state.emptyText}</KindCommandEmpty
      ><KindCommandList>
        {#if rows}{@render rows(state)}{:else}
          {#each state.pages as { page, sections } (page ?? "")}
            <KindCommandPage value={page}>
              {#each sections as section, index (section.footer ? "\u0000footer" : (section.label ?? ""))}
                <PickerSectionRows {section} separated={section.footer && index > 0} />
              {/each}
            </KindCommandPage>
          {/each}
        {/if}
      </KindCommandList>
    </KindCommand>
  {/snippet}
</parts.Command>
