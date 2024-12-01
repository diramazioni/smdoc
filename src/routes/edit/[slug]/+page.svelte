<script lang="ts">
  // UI 
	import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

	import { AccordionItem } from "$lib/components";
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import { Save, Eye, Copy, FilePlus, FolderPlus, FileUp, Link, FilePenLine, ArrowUpToLine, FileCode, TypeOutline, ImageUp, Trash2} from 'lucide-svelte';
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
  let list_md = $state(data.list_md);
  let list_pdf = $state(data.list_pdf);
  let list_img = $state(data.list_img);
  let slug = $derived(slugify(titleValue))
  // let markdown = $state(data.md_only)
  let files = $state();

	onMount(() => {

  });
  
  $effect.pre(() => {
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
  async function handleDelete(slug) {
    const formData = new FormData();
    formData.append('slug', slug);
    let response = await fetch('?/delete', {
        method: 'POST',
        body: formData
    });
    let result = await response.json();
    if(result.type === 'success') {
      list_md = list_md.filter(item => item !== slug);
      list_pdf = list_pdf.filter(item => item !== slug);
      list_img = list_img.filter(item => item !== slug);
      toast.success(`${slug} deleted`)
    }    
  }

  function clearFields() {
    tabState = 'edit'
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
 

{#snippet uploadForm()}
<form action="?/upload" method="POST" enctype="multipart/form-data">
  <div class="flex max-w-full items-center m-4 space-x-3">
    <Label for="title">Upload asset</Label>
    <Button class="menu" type="submit" variant="secondary">
      <ArrowUpToLine />
    </Button>
    <input bind:files multiple type="file" name="file" placeholder="file" required/>
    {#if files}
      <div class="flex-col">
        {#each Array.from(files) as file}
        <div>
          <span class="text-sm">{file.name}</span> <span class="text-sm">({file.size} bytes)</span>
        </div>
        {/each}
      </div>
    {/if}
  </div>
</form>  
{/snippet}

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
    <Button type="submit">Save META</Button>
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

{#snippet assets()}
  {#snippet assetItems(assetList)}
    <ScrollArea class="h-[400px] w-full rounded-md border p-4">
      {#each assetList as asset}
        {@render assetItem(asset)}
      <!-- <Separator class="my-2" /> -->
      {/each} 
    </ScrollArea>
  {/snippet}
  
  {#snippet assetItem(asset)}
  {@const assetUrl = asset.endsWith('.md') ? `/${asset.slice(0, -3)}` : `/assets/${asset}`}
  {@const assetFile = asset.endsWith('.md') ? false : true}
  {@const assetPdf = asset.endsWith('.pdf') ? true : false}
  
  <div class="flex items-center border bg-muted hover:bg-primary-foreground text-muted-foreground my-2">

      <button use:copy={assetUrl}  onclick={() => {toast.success(`${assetUrl} Link copied to clipboard`)}}>
        <Copy size={15} class="cursor-pointer m-1" />
      </button>
      {#if assetFile && !assetPdf}
        <button use:copy={assetUrl}  onclick={() => {
          editorRef.insertMarkdown(`![${assetUrl.slice(1)}](${assetUrl})`) }}>
          <Link size={15} class="cursor-pointer m-1" />
        </button>
      {:else}
        <button use:copy={assetUrl}  onclick={() => {
          editorRef.insertMarkdown(`[${assetUrl.slice(1)}](${assetUrl})`) }}>
          <Link size={15} class="cursor-pointer m-1" />
        </button>
      {/if}
      <button use:copy={assetUrl}  onclick={() => {handleDelete(asset)}}>
        <Trash2 size={15} class="cursor-pointer m-1" />
      </button>
      
      {#if assetFile && !assetPdf}
        <img src={assetUrl} class="h-16 w-16 object-cover" alt={asset} />
      {/if}
      <div class="text-sm ml-2">
          <a href={'/edit' + assetUrl} class="hover:underline" data-sveltekit-reload >{asset} </a>
        <!-- rel="external" --> 
      </div>
    </div>
  {/snippet}

<Tabs.Root value="md">
  <Tabs.List class="grid w-full grid-cols-3">
    <Tabs.Trigger value="md"> <FilePenLine/> </Tabs.Trigger>
    <Tabs.Trigger value="pdf">  <img src="/pdf-icon.svg" class="h-6 w-8" alt="pdf" /> </Tabs.Trigger>
    <Tabs.Trigger value="img" ><ImageUp/></Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="md">
    {@render assetItems(list_md)}
  </Tabs.Content>
  <Tabs.Content value="pdf">
    {@render assetItems(list_pdf)}
  </Tabs.Content>
  <Tabs.Content value="img">
    {@render assetItems(list_img)}
  </Tabs.Content>
</Tabs.Root>        
{/snippet}


<Tabs.Root bind:value={tabState} 	
	onValueChange={(v) => {
		tabState = v;
		if (v === 'edit') {
      titleValue = data.frontmatter.title
      descriptionValue = data.frontmatter.description
      editorRef?.setMarkdown(data.md_only)
		} 
	}}>
	<Tabs.List class="grid w-full grid-cols-2">
		<Tabs.Trigger value="edit">
      <FileCode/>&nbsp; Meta
    </Tabs.Trigger>
      
    <Tabs.Trigger value="upload"> 
      <ArrowUpToLine />&nbsp; Upload
    </Tabs.Trigger>
	  <!-- <Tabs.Trigger value="view" >View</Tabs.Trigger> -->
	</Tabs.List>
	<Tabs.Content value="edit">
    {@render metaForm()}

	</Tabs.Content>
	<Tabs.Content value="upload">
    {@render uploadForm()}
	</Tabs.Content>
	<!-- <Tabs.Content value="view">
		<MarkdocRenderer children={JSON.parse(data.children)} />
	</Tabs.Content> -->
</Tabs.Root>    

{@render cmdMenu()}
<Resizable.PaneGroup  direction="horizontal"
  class="h-full w-full rounded-lg border relative -mt-10"
>
  <Resizable.Pane defaultSize={80} >  
    {@render editor()}
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane defaultSize={20}>
    {@render assets()}
  </Resizable.Pane>
</Resizable.PaneGroup>
  <!-- {@html data.html} -->