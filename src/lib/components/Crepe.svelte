<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Crepe } from "@milkdown/crepe";
  import "@milkdown/crepe/theme/common/style.css";
  import "@milkdown/crepe/theme/frame.css";
  import { insert, replaceAll, callCommand } from "@milkdown/kit/utils";

  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";

  let { markdown }: { markdown: string } = $props();

  let editor: Crepe | undefined = $state();

  onMount(() => {
    editor = new Crepe({
      root: document.getElementById("app") as HTMLElement,
      defaultValue: markdown,
    });

    editor.create().then(() => {
      //console.log('Editor created');
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  export function getMarkdown() {
    return editor?.getMarkdown();
  }

  export function setMarkdown(value: string) {
    if (editor) {
      editor.editor.action(replaceAll(value));
    }
  }

  export function insertMarkdown(value: string) {
    if (editor) {
      editor.editor.action(insert(value));
    }
  }

  export function callEditorCommand(cmdKey: string, payload: any) {
    if (editor) {
      editor.editor.action(callCommand(cmdKey, payload));
    }
  }
</script>

<div id="app"></div>
