import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../components/ui/solid/sidebar.js";

export default function SidebarItem() {
  return (
    <Sidebar label="Chats" class="h-64">
      <SidebarPanel>Chats</SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </Sidebar>
  );
}
