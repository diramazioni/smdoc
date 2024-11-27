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
  // import { Editor, Viewer } from 'tui-editor-svelte';
  // import Editor from '$lib/components/Editor.svelte';
  import Editor from '$lib/components/Crepe.svelte';
  // Svelte
  import { onMount } from 'svelte';
  import { page } from '$app/stores';


	let { data } = $props()
	let tabState = $state('edit')

  let editorRef = $state(); // Reference to store the editor instance
  let titleValue = $state(data.frontmatter.title)
  let descriptionValue = $state(data.frontmatter.description)
  let slug = $derived(slugify(titleValue))
  let markdown = $state(data.md_only)

	onMount(() => {

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
    console.log(updatedContent)
    
    const formData = new FormData();
    formData.append('updatedContent', updatedContent);
    formData.append('slug', slug);
    
    response = await fetch('?/save', {
        method: 'POST',
        body: formData
    });
    if(result.type === 'success') {
      toast.success('Document saved')
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
<!-- <button onclick={invokeTest}>Invoke Method</button> -->
 

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
<form method="POST" action="/edit/{slug}?/frontmatter" class="w-full bg-muted p-2">
  <div class="flex max-w-full items-center m-4 space-x-3">
    <Label for="title">Title</Label>
    <Input type="text" name="title" placeholder="Title" 
      bind:value={titleValue} />
    <Label for="description">Description</Label>
    <Input type="text" name="description" placeholder="Description" 
      value={descriptionValue} />
      <button type="button" use:copy={`/${slug}`} onclick={() => {toast.success(`/${slug} Link copied to clipboard`)}}> 
        <Link />
      </button>  
    <Input type="text" name="slug_view" disabled value={slug} class="w-20"/> 
    <input name="slug" hidden value={slug} class="w-20"/> 
    <Button type="submit">Save META</Button>
  </div>
</form>    
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
    <Button onclick={clearFields} class="menu" type="button" variant="secondary">
      <FilePlus />
    </Button>
  </div>
{/snippet}
{#snippet tuieditor()}
  <Editor
  bind:this={editorRef}
  initialValue={data.md_only}
  pluginsOn={['colorSyntax', 'tableMergedCell','codeSyntaxHighlight', 'chart', 'uml']} 
  />
{/snippet}

{#snippet editor()}
<Editor bind:this={editorRef} markdown={data.md_only} />
{/snippet}

<Tabs.Root bind:value={tabState} 	
	onValueChange={(v) => {
		tabState = v;
		if (v === 'edit') {
      titleValue = data.frontmatter.title
      descriptionValue = data.frontmatter.description
      editorRef?.setMarkdown(data.md_only)
		} else if (v === 'newdoc') {
      console.log('newdoc')
      titleValue = descriptionValue = ""
      editorRef?.setMarkdown('')
    }
		// additional logic here.
	}}>
	<Tabs.List class="grid w-full grid-cols-3">
		<Tabs.Trigger value="edit"><FilePenLine/> Edit</Tabs.Trigger>
		<Tabs.Trigger value="newdoc"> New</Tabs.Trigger>
	  <Tabs.Trigger value="view" >View</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="edit">
    {@render metaForm()}

	</Tabs.Content>
	<Tabs.Content value="newdoc">
    {@render metaForm()}


	</Tabs.Content>

	<Tabs.Content value="view">
		<MarkdocRenderer children={JSON.parse(data.children)} />
	</Tabs.Content>
  </Tabs.Root>    
  <div>

    {@render cmdMenu()}
    {@render editor()}
  </div>

<!-- <Accordion.Root bind:value={accordionState} type="multiple" class="w-full bg-muted p-2">
  <AccordionItem value="meta" title="meta">

 
  </AccordionItem>
</Accordion.Root> -->


  <!-- {@html data.html} -->