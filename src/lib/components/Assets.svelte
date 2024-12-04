<script lang="ts">
  import { copy } from 'svelte-copy';
  import { toast } from "svelte-sonner";
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  import { Copy, Link, FilePenLine,ImageUp, Trash2} from 'lucide-svelte';
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import UploadForm from "$lib/components/UploadForm.svelte";
  import Dialog from '$lib/components/Dialog.svelte';

	let { editorRef = $bindable() } = $props()

  let tabState = $state('md');
  let listAssets = $state($page.data.listAssets['md']);
	let searchQuery = $state("");
	let filteredItems = $derived(listAssets.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
	));

  onMount(() => {
  });
  $effect(() => {
    if (editorRef) {

    } 
    //console.log(`effect url ${$page.url.pathname}`);
  });
  async function handleDelete(slug) {
    const formData = new FormData();
    formData.append('slug', slug);
    let response = await fetch('?/delete', {
        method: 'POST',
        body: formData
    });
    let result = await response.json();
    if(result.type === 'success') {
      listAssets = listAssets.filter(item => item !== slug);
      toast.success(`${slug} deleted`)
    }
  }
</script>

 

<Tabs.Root bind:value={tabState}
  onValueChange={(v) => {
    tabState = v;
    listAssets = $page.data.listAssets[v];
}}>

  <Tabs.List class="grid w-full grid-cols-3">
    <Tabs.Trigger value="md"> <FilePenLine/> </Tabs.Trigger>
    <Tabs.Trigger value="pdf">  <img src="/pdf-icon.svg" class="h-6 w-8" alt="pdf" /> </Tabs.Trigger>
    <Tabs.Trigger value="img" ><ImageUp/></Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="md">
    {@render assetItems(filteredItems)}
  </Tabs.Content>
  <Tabs.Content value="pdf">
    {@render assetItems(filteredItems)}
  </Tabs.Content>
  <Tabs.Content value="img">
    {@render assetItems(filteredItems)}
  </Tabs.Content>
</Tabs.Root>

{#snippet assetItems(assetList)}
  <UploadForm />
  <input
    type="text"
    placeholder="Search assets"
    bind:value={searchQuery}
    class="w-full px-4 py-2 ml-4 mb-2 border bg-slate-200 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>

  {#if assetList.length > 0}
    <ScrollArea class="h-[400px] w-full rounded-md border p-4">
      {#each assetList as asset}
        {@render assetItem(asset)}
        <!-- {asset} -->
      <!-- <Separator class="my-2" /> -->
      {/each}
    </ScrollArea>
  {:else}
    <div class="text-center text-gray-500 py-4">No items match your search.</div>
  {/if}
{/snippet}

{#snippet assetItem(asset)}
{@const assetUrl = asset.endsWith('.md') ? `/${asset.slice(0, -3)}` : `/assets/${asset}`}
{@const assetMDoc = asset.endsWith('.md') ? true : false}
{@const assetPdf = asset.endsWith('.pdf') ? true : false}

  <div class="flex items-center border bg-muted hover:bg-primary-foreground text-muted-foreground my-2">


    {#if !assetMDoc && !assetPdf}
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
    <button use:copy={assetUrl}  onclick={() => {toast.success(`${assetUrl} Link copied to clipboard`)}}>
      <Copy size={15} class="cursor-pointer m-1" />
    </button>
    <Dialog>
      {#snippet trigger()}
        <Trash2 size={15} class="cursor-pointer m-1" />
      {/snippet}
      {#snippet title()}
        Delete {asset}?
      {/snippet}
     
      {#snippet description()}
        This will permanently delete the asset from the server.
        Are you sure you want to continue? <br/>
        <button class="m-auto w-full flex justify-center hover:bg-red-500 hover:text-white"  onclick={() => {handleDelete(asset)}}>
          <Trash2 size={25} class="cursor-pointer m-1" />
        </button>
      {/snippet}
     
      <!-- Additional dialog content here... -->
    </Dialog>

    
    {#if !assetMDoc && !assetPdf}
      <img src={assetUrl} class="h-16 w-16 object-cover" alt={asset} />
    {/if}
    <div class="text-sm ml-2">
        <a href={'/edit' + assetUrl} class="hover:underline" data-sveltekit-reload >{asset} </a>
      <!-- rel="external" -->
    </div>
  </div>
{/snippet}
