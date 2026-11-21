<script lang="ts">
  import {
    Sidebar,
    SidebarHandle,
    SidebarInset,
    SidebarPanel,
    SidebarTrigger,
  } from "../components/ui/svelte/sidebar/index.js";
</script>

<Sidebar label="Chats" class="h-64">
  <SidebarPanel>Chats</SidebarPanel>
  <SidebarHandle />
  <SidebarInset>
    <SidebarTrigger />
  </SidebarInset>
</Sidebar>
