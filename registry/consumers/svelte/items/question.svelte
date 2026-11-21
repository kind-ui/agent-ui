<script lang="ts">
  import { Question } from "../components/ui/svelte/question/index.js";
</script>

<Question
  label="Deploy questions"
  questions={[{ id: "env", prompt: "Where should it deploy?", kind: "single", options: [{ value: "staging", label: "Staging" }] }]}
/>
