<!-- "+4 −2", read as "4 additions, 2 deletions". -->
<script lang="ts">
  let { added, removed, name }: { added: string; removed: string; name: string } = $props();
</script>

<span aria-hidden="true"
  >{#if added}<span data-diff-added="">{added}</span>{/if}{#if added && removed}{" "}{/if}{#if removed}<span
      data-diff-removed="">{removed}</span
    >{/if}</span
><span data-diff-hidden="">{name}</span>
