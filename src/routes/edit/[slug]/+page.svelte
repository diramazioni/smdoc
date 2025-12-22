<script lang="ts">
  // UI 
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import Dialog from '$lib/components/Dialog.svelte';

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
  import { onDestroy, onMount, setContext } from 'svelte';
  import { page } from '$app/stores';
  import { goto, invalidate, invalidateAll } from "$app/navigation";


	let { data } = $props()
  
  let useTuiEditor = $state(true);
  let editorRef = $state(); // Reference to store the editor instance
  let titleValue = $state(data.frontmatter.title)
  let descriptionValue = $state(data.frontmatter.description)
  let slug = $derived(slugify(titleValue))
  
  let autoSaveDialog = $state(false);

  let interval = $state(); // 30 seconds
	onMount(() => {
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  $effect(() => {
    interval = setInterval(() => {
      autoSaveDialog = true
    console.log('save-e')
    }, 300000) // 5 min in milliseconds
  });

  async function handleSave(event) {
    event.preventDefault(); // Prevent the default form submission
    // ?/frontmatter
    autoSaveDialog = false
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
    
    const formData = new FormData();
    formData.append('updatedContent', updatedContent);
    formData.append('slug', slug);
    response = await fetch('?/save', {
        method: 'POST',
        body: formData
    });
    result = await response.json();
    if(result.type === 'success') {
      toast.success(`${slug} saved`)
      await goto(`/edit/${slug}`, { invalidateAll: true });
      // await invalidate('page');

    } else {
      toast.error(`Error saving document: ${result.message}`) 
    }
  }

  function clearFields() {
    titleValue = descriptionValue = ""
    editorRef?.setMarkdown('')
  }

  function scrollFixed(node: HTMLElement) {
    let originalTop;
    let originalWidth;

    function handleScroll() {
      if (!originalTop) {
        originalTop = node.getBoundingClientRect().top;
        originalWidth = node.getBoundingClientRect().width;
      }
      
      if (window.scrollY > originalTop) {
        node.classList.add('fixed', 'top-0');
      } else {
        node.classList.remove('fixed', 'top-0');
      }
    }

    document.addEventListener('scroll', handleScroll);

    return {
      destroy() {
        document.removeEventListener('scroll', handleScroll);
      }
    };
  }  
</script>
  <!-- <a href="/edit/home" class="hover:underline">go home</a>
<a href="/home" class="hover:underline">go home</a>
 -->

<!-- <button onclick={invokeTest}>Invoke Method</button> -->

<Dialog bind:open={autoSaveDialog}>
  {#snippet trigger()}
      <!-- <Save size={15} class="cursor-pointer m-1" 
      onclick={() => handleSave(event) } /> -->
  {/snippet}

  {#snippet title()}
    Save ?
  {/snippet}

  {#snippet description()}
  <p>
    Save the changes?
  </p>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    role="button" tabIndex="0"
    onclick={() => handleSave(event)}
    onkeydown={(e) => e.key === 'Enter' && handleSave(event)}
    class="cursor-pointer m-auto w-full flex justify-center hover:bg-green-500 hover:text-white"
  >
    <Save size={15} class="m-1" />
  </div>
  {/snippet}
</Dialog>

{#snippet metaForm()}
<form method="POST" action="/edit/{slug}?/frontmatter" class="w-full bg-muted p-2 -mt-2">
  <div class="flex max-w-full items-center m-4 space-x-3">
    <Label for="title">Title</Label>
    <Input type="text" name="title" placeholder="Title" bind:value={titleValue} />
    <Label for="description">Description</Label>
    <Input type="text" name="description" placeholder="Description" bind:value={descriptionValue} />
      <button type="button" use:copy={`/${slug}`} onclick={() => {toast.success(`/${slug} Link copied to clipboard`)}}> 
        <Copy />
      </button>  
    <Input type="text" name="slug_view" disabled value={slug} class="w-20"/> 
    <input name="slug" hidden value={slug} class="w-20"/> 
    <!-- <Button type="submit">Save new</Button> -->
  </div>
</form>    
{/snippet}

{#snippet cmdMenu()}
  <div id="cmdMenu" class="relative z-10 flex max-w-fit items-center space-x-3 ">
    <form method="POST" action="?/save" onsubmit={handleSave}>
      <input type="hidden" name="updatedContent" value="" />
      <Button class="menu" type="submit" variant="outline">
        <Save />              
      </Button>
    </form>      
    <Button onclick={() => handleSave()} href={$page.url.pathname.replace('/edit','')} 
      class="menu" type="button" variant="outline">
      <Eye />              
    </Button>
    <Button onclick={clearFields} class="menu" type="button" variant="outline">
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
    <div class="min-w-96 max-w-[600px]" use:scrollFixed>
     <Assets bind:editorRef />
    </div>
  </Resizable.Pane>
</Resizable.PaneGroup>


