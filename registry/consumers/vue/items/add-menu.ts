import { h } from "vue";
import { AddMenu } from "../components/ui/vue/add-menu.js";

export default () => h(AddMenu, { items: [{ id: "upload", label: "Upload file" }], onAction: () => {} });
