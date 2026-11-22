<script lang="ts">
  import { ConversationSearch } from "../components/ui/svelte/conversation-search/index.js";
</script>

<ConversationSearch defaultOpen messages={[{ id: "1", text: "Hello." }]} />
