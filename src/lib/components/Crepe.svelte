<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Crepe } from '@milkdown/crepe';
  import '@milkdown/crepe/theme/common/style.css';
  import "@milkdown/crepe/theme/frame.css";
  import { insert, replaceAll, callCommand  } from '@milkdown/kit/utils';

  import { page } from '$app/stores';
  import { toast } from "svelte-sonner";


  let { markdown } = $props(); //
  
  let editor: Crepe  = $state();

  onMount( () => {
    editor = new Crepe({
      root: document.getElementById('app'),
      defaultValue: markdown,
    })
    
    editor.create().then(() => {
        //console.log('Editor created');
    });
  })

  $effect(() => {  
    return () => {
      editor.destroy();
      //console.log('Editor destroy');
    };
  })

  export function getMarkdown() {
    return editor?.getMarkdown();
  }

  export function setMarkdown(value:string) {
    editor.editor.action(replaceAll(value))
  }

  export function insertMarkdown(value:string) {
    editor.editor.action(insert(value))
  }

  export function callEditorCommand(cmdKey, payload) {
    editor.editor.action(callCommand(cmdKey, payload))
  }

</script>
<div id="app"></div>
<!-- <button class="btn" on:click={handleSave}> Publish</button> -->
