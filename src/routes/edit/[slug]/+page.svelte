<script lang="ts">
  // UI 
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";

  import { Save, Eye, Copy, FilePlus } from 'lucide-svelte';
  // Utils 
  import slugify from 'voca/slugify';
  import { copy } from 'svelte-copy';
  import { toast } from "svelte-sonner";
  // My component
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
  // import { Editor, Viewer } from 'tui-editor-svelte';
  import TuiEditor from '$lib/components/Editor.svelte';
  import Crepe from '$lib/components/Crepe.svelte';
  import Assets from '$lib/components/Assets.svelte';
  // Svelte
  import { onMount, setContext } from 'svelte';
  import { page } from '$app/stores';


	let { data } = $props()
  
  let useTuiEditor = $state(false);
  let editorRef = $state(); // Reference to store the editor instance
  let titleValue = $state(data.frontmatter.title)
  let descriptionValue = $state(data.frontmatter.description)
  let slug = $derived(slugify(titleValue))
  


	onMount(() => {
  });
  
  $effect(() => {

    //console.log(`effect url ${$page.url.pathname}`);
  });

  async function handleSave(event) {
    event.preventDefault(); // Prevent the default form submission
    // ?/frontmatter
    const frontmatterData = new FormData();
    frontmatterData.append('title', titleValue);
    frontmatterData.append('description', descriptionValue);
    frontmatterData.append('slug', slug);
    let response = await fetch('?/frontmatter', {
        method: 'POST',
        body: frontmatterData
    });
    let result = await response.json();
    if(result.type === 'success') {
      toast.success('Frontmatter saved')
    }
    const updatedContent = editorRef?.getMarkdown();
    // console.log(updatedContent)
    
    const formData = new FormData();
    formData.append('updatedContent', updatedContent);
    formData.append('slug', slug);
    
    response = await fetch('?/save', {
        method: 'POST',
        body: formData
    });
    result = await response.json();
    if(result.type === 'success') {
      toast.success('Document saved')
    } else {
      toast.error(`Error saving document: ${result.message}`) 
    }
  }

  function clearFields() {
    titleValue = descriptionValue = ""
    editorRef?.setMarkdown('')
  }
  // function invokeTest() {
  //   //const editorInstance = editorRef.getEditor();
  //   //editorInstance.changeMode('markdown');
  //   // editorInstance.exec('bold');
  //   // editorInstance.exec('addLink', { linkText: 'TOAST UI', linkUrl: 'https://ui.toast.com' });
  //   // editorInstance.changePreviewStyle('tab');
  //   //editorInstance.insertText('[example test]("http://example.com")')
    
  //   // editorRef.insertMarkdown('# easy squeezy')
  //   // editorRef.setMarkdown('# easy squeezy')
  //   markdown = editorRef.getMarkdown()
  //   console.log(markdown);
  // }
</script>

<!-- <a href="/edit/home" class="hover:underline">go home</a>
<a href="/home" class="hover:underline">go home</a>
 -->

<!-- <button onclick={invokeTest}>Invoke Method</button> -->

{#snippet metaForm()}
<form method="POST" action="/edit/{slug}?/frontmatter" class="w-full bg-muted p-2 -mt-2">
  <div class="flex max-w-full items-center m-4 space-x-3">
    <Label for="title">Title</Label>
    <Input type="text" name="title" placeholder="Title" bind:value={titleValue} />
    <Label for="description">Description</Label>
    <Input type="text" name="description" placeholder="Description" value={descriptionValue} />
      <button type="button" use:copy={`/${slug}`} onclick={() => {toast.success(`/${slug} Link copied to clipboard`)}}> 
        <Copy />
      </button>  
    <Input type="text" name="slug_view" disabled value={slug} class="w-20"/> 
    <input name="slug" hidden value={slug} class="w-20"/> 
    <Button type="submit">Save new</Button>
  </div>
</form>    
{/snippet}

{#snippet cmdMenu()}
  <div id="cmdMenu" class="relative z-10 flex max-w-fit items-center space-x-3 ">
    <form method="POST" action="?/save" onsubmit={handleSave}>
      <input type="hidden" name="updatedContent" value="" />
      <Button class="menu" type="submit" variant="secondary">
        <Save />              
      </Button>
    </form>      
    <Button href={$page.url.pathname.replace('/edit','')} class="menu" type="button" variant="secondary">
      <Eye />              
    </Button>
    <Button onclick={clearFields} class="menu" type="button" variant="secondary">
      <FilePlus />
    </Button>
    <div>
      <!-- switch editor-->
       <Label for="editor">
        {#if useTuiEditor}
          TuiEditor
        {:else}
          Crepe
        {/if}
       </Label>
       <Switch bind:checked={useTuiEditor} />
      <!-- switch editor-->
    </div>
  </div>
{/snippet}
{#snippet tuiEditor()}
<div class="mt-30">
  <TuiEditor
  bind:this={editorRef}
  initialValue={data.md_only}
  pluginsOn={['tableMergedCell','codeSyntaxHighlight', 'chart', 'uml']} 
  />
</div>
{/snippet}

{#snippet crepeEditor()}
<Crepe bind:this={editorRef} markdown={data.md_only} />
{/snippet}
<Separator class="mt-2"/>

{@render metaForm()}

{@render cmdMenu()}
<Resizable.PaneGroup  direction="horizontal"
  class="h-full w-full rounded-lg border relative "
>
  <Resizable.Pane defaultSize={80} >
    {#if useTuiEditor}
      {@render tuiEditor()}
    {:else}
      {@render crepeEditor()}
    {/if}
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane defaultSize={20}>
    <!-- {@render assets()} -->
     <Assets bind:editorRef/>
  </Resizable.Pane>
</Resizable.PaneGroup>
  <!-- {@html data.html} -->