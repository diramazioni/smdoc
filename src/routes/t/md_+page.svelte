<script lang="ts">
  import { Editor, Viewer } from 'tui-editor-svelte';

  import { content } from "./dummy.js";
  

  let viewerMode = $state(false);
  let editorRef = $state(); // Reference to store the component instance
  let editor = $derived(editorRef.getEditor());

  function invokeTest() {
    // editor.changePreviewStyle('tab');
    editor.exec('bold');
    editor.exec('addLink', { linkText: 'TOAST UI', linkUrl: 'https://ui.toast.com' });
    //editor.insertText('[example test]("http://example.com")')
  }

</script>

<main>

<h1>Welcome to tui-editor-svelte for Svelte 5!</h1>
<p>
  <button onclick={() => (viewerMode = !viewerMode)}>
    {viewerMode ? "Editor mode" : "Viewer mode"}
  </button>
</p>

{#if viewerMode}
  <Viewer 
    initialValue={content} 
    pluginsOn={['tableMergedCell','codeSyntaxHighlight','chart', 'uml']} 
    onload={() => console.log("Viewer loaded")} 
    />
{:else}
  <Editor
    bind:this={editorRef}
    initialValue={content}
    pluginsOn={['colorSyntax', 'tableMergedCell','codeSyntaxHighlight', 'chart', 'uml']} 
    onload={() => console.log("Editor loaded")}
  />
  <!-- onchange={() => console.log('Editor changed')}
    onfocus={() => console.log('Editor focused')}
    onblur={() => console.log('Editor blur')} -->
{/if}
<button onclick={invokeTest}>Invoke Method</button>
</main>

<style>
  
  h1 {
    margin: 0 auto;
    text-align: center;
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

</style>