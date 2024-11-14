<script lang="ts">
  // UI 
	import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
	import { AccordionItem } from "$lib/components";
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import { Save, Eye, FilePlus, FolderPlus, FileUp, Link, FilePenLine } from 'lucide-svelte';
  // Utils 
  import slugify from 'voca/slugify';
  import { copy } from 'svelte-copy';
  import { toast } from "svelte-sonner";
  // Renderer
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
  import { Editor, Viewer } from 'tui-editor-svelte';
  // Svelte
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

	let { data } = $props()
	let tabState = $state('edit')
  let accordionState = $state<string[]>(["meta"]);

  let editorRef = $state(); // Reference to store the component instance
  let titleValue = $state(data.frontmatter.title)
  let descriptionValue = $state(data.frontmatter.description)
  let slug = $derived(slugify(titleValue))
  //let astContent = $state(JSON.parse(data.children))

/*
	async function saveMarkdown() {
    if (!editorRef) return; // Check if the editor component is loaded
    const editor = editorRef.getEditor();
    const markdownContent = editor.getMarkdown();
    const formData = new FormData();
    formData.append('updatedContent', markdownContent);

    const response = await fetch('?/save', {
					method: 'POST',
					body: formData
				});

    const result = await response.json();

    console.log(result)
    toast.success('Document saved')
	}
	onMount(() => {

	});
*/
  function handleSave(event) {
    event.preventDefault(); // Prevent the default form submission
    const updatedContent = editorRef?.getEditor().getMarkdown();
    // Set the value for the hidden input
    event.target.querySelector('input[name="updatedContent"]').value = updatedContent;
    event.target.submit();
  }
</script>

<!-- 
<form action="?/new&redirectTo={$page.url.pathname}" method="POST">
  <Button class="menu" type="submit" variant="secondary">
    <FilePlus />              
  </Button>
</form>
<form action="?/newFolder&redirectTo={$page.url.pathname}" method="POST">
  <Button class="menu" type="submit" variant="secondary">
    <FolderPlus />              
  </Button>
</form>   
<form action="?/newFolder&redirectTo={$page.url.pathname}" method="POST">
  <Button class="menu" type="submit" variant="secondary">
    <FileUp />
  </Button>
</form>       -->
{#snippet metaForm()}
    <Label for="title">Title</Label>
    <Input type="text" name="title" placeholder="Title" 
      bind:value={titleValue} />
    <Label for="description">Description</Label>
    <Input type="text" name="description" placeholder="Description" 
      value={descriptionValue} />
      <button type="button" use:copy={`/${slug}`} onclick={() => {toast.success(`/${slug} Link copied to clipboard`)}}> 
        <Link />
      </button>  
    <Input type="text" name="slug" disabled value={slug} class="w-20"/> 
{/snippet}

{#snippet cmdMenu()}
  <div id="cmdMenu" class="flex max-w-full items-center space-x-3">
    <form method="POST" action="?/save" onsubmit={handleSave}>
      <input type="hidden" name="updatedContent" value="" />
      <Button class="menu" type="submit" variant="secondary">
        <Save />              
      </Button>
    </form>      
    <Button href={$page.url.pathname.replace('/edit','')} class="menu" type="button" variant="secondary">
      <Eye />              
    </Button>
  </div>
{/snippet}
{#snippet editor()}
  <Editor
  bind:this={editorRef}
  initialValue={data.md_only}
  pluginsOn={['colorSyntax', 'tableMergedCell','codeSyntaxHighlight', 'chart', 'uml']} 
  />
{/snippet}

<Tabs.Root bind:value={tabState} 	
	onValueChange={(v) => {
		tabState = v;
		if (v === 'edit') {
      titleValue = data.frontmatter.title
      descriptionValue = data.frontmatter.description
      editorRef?.getEditor().setMarkdown(data.md_only)
		} else if (v === 'newdoc') {
      console.log('newdoc')
      titleValue = descriptionValue = ""
      editorRef?.getEditor().setMarkdown('')
    }
		// additional logic here.
	}}>
	<Tabs.List class="grid w-full grid-cols-3">
		<Tabs.Trigger value="edit"><FilePenLine/> Edit</Tabs.Trigger>
		<Tabs.Trigger value="newdoc"><FilePlus /> New</Tabs.Trigger>
	  <Tabs.Trigger value="view" >View</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="edit">
    <form method="POST" action="?/frontmatter" class="w-full bg-muted p-2">
      <div class="flex max-w-full items-center m-4 space-x-3">
        {@render metaForm()}
        <Button type="submit">Save META</Button>
      </div>
    </form>
    {@render cmdMenu()}
    {@render editor()}

	</Tabs.Content>
	<Tabs.Content value="newdoc">
    <form method="POST" action="?/newdoc" class="w-full bg-muted p-2">
      <div class="flex max-w-full items-center m-4 space-x-3">
        {@render metaForm()}
        <Button type="submit">New doc</Button>
      </div>
    </form>
    {@render cmdMenu()}
    {@render editor()}

	</Tabs.Content>

	<Tabs.Content value="view">
		<MarkdocRenderer children={JSON.parse(data.children)} />
	</Tabs.Content>
  </Tabs.Root>    

<!-- <Accordion.Root bind:value={accordionState} type="multiple" class="w-full bg-muted p-2">
  <AccordionItem value="meta" title="meta">

 
  </AccordionItem>
</Accordion.Root> -->


  <!-- {@html data.html} -->