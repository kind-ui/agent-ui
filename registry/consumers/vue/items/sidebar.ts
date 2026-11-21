import { h } from "vue";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../components/ui/vue/sidebar.js";

export default () =>
  h(Sidebar, { label: "Chats", class: "h-64" }, () => [
    h(SidebarPanel, null, () => "Chats"),
    h(SidebarHandle),
    h(SidebarInset, null, () => h(SidebarTrigger)),
  ]);
