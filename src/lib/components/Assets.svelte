<script lang="ts">
  import { copy } from 'svelte-copy';
  import { toast } from "svelte-sonner";
  import { page } from '$app/stores';
  import { Copy, Link, FilePenLine, ImageUp, Trash2 } from 'lucide-svelte';
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import UploadForm from "$lib/components/UploadForm.svelte";
  import Dialog from '$lib/components/Dialog.svelte';
    import { onMount } from 'svelte';

  let { editorRef = $bindable() } = $props();
  let tabState = $state('md');
  let listAssets = $state($page.data.listAssets['md']);
  let searchQuery = $state("");
  let selectedAsset = $state<string | boolean>(null);
  
  let filteredItems = $derived(listAssets.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  $effect(() => {
    listAssets = $page.data.listAssets['md']

  })
  
  async function handleDelete(slug: string) {
    const formData = new FormData();
    formData.append('file_name', slug);
    
    let response = await fetch('/api/upload', {
      method: 'DELETE',
      body: formData
    });
    
    if (response.ok) {
      listAssets = listAssets.filter(item => item !== slug);
      selectedAsset = false;
      toast.success(`${slug} deleted`);
    } else {
      toast.error(`Failed to delete ${slug}`);
    }
  }

  function getAssetUrl(asset: string): string {
    if (asset.endsWith('.md')) {
      return `/${asset.slice(0, -3)}`;
    }
    return `/assets/${asset}`;
  }

  function insertAsset(asset: string) {
    if (!editorRef) return;
    
    const assetUrl = getAssetUrl(asset);
    if (asset.endsWith('.md') || asset.endsWith('.pdf')) {
      editorRef.insertMarkdown(`[${asset}](${assetUrl})`);
    } else {
      editorRef.insertMarkdown(`![${asset}](${assetUrl})`);
    }
  }
</script>

<Tabs.Root 
  bind:value={tabState}
  onValueChange={(v) => {
    tabState = v;
    listAssets = $page.data.listAssets[v];
  }} >
  <Tabs.List class="grid w-full grid-cols-3">
    <Tabs.Trigger value="md">
      <FilePenLine/>
    </Tabs.Trigger>
    <Tabs.Trigger value="pdf">
      <img src="/pdf-icon.svg" class="h-6 w-8" alt="pdf" />
    </Tabs.Trigger>
    <Tabs.Trigger value="img">
      <ImageUp/>
    </Tabs.Trigger>
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
    class="w-full px-4 py-2 ml-4 mb-2 border bg-slate-200 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  
  {#if assetList.length > 0}
    <ScrollArea class="h-[400px] w-full rounded-md border p-4">
      {#each assetList as asset}
        {@render assetItem(asset)}
      {/each}
    </ScrollArea>
  {:else}
    <div class="text-center text-gray-500 py-4">
      No items match your search.
    </div>
  {/if}
{/snippet}

{#snippet assetItem(asset)}
  {@const assetUrl = getAssetUrl(asset)}
  {@const isMarkdown = asset.endsWith('.md')}
  {@const isPdf = asset.endsWith('.pdf')}
  
  <div class="flex items-center border bg-muted hover:bg-primary-foreground text-muted-foreground my-2">
    <button 
      use:copy={assetUrl}
      onclick={() => insertAsset(asset)}
    >
      <Link size={15} class="cursor-pointer m-1" />
    </button>

    <button 
      use:copy={assetUrl}
      onclick={() => {
        toast.success(`${assetUrl} Link copied to clipboard`);
      }}
    >
      <Copy size={15} class="cursor-pointer m-1" />
    </button>

    <Dialog 
      open={selectedAsset} 
    >
      {#snippet trigger()}
          <Trash2 size={15} class="cursor-pointer m-1" 
          onclick={() => selectedAsset = asset}/>
      {/snippet}
      
      {#snippet title()}
        Delete {asset}?
      {/snippet}
      
      {#snippet description()}
      <p>
        This will permanently delete the asset.
        Are you sure you want to continue?
      </p>
      <div class="m-auto w-full flex justify-center hover:bg-red-500 hover:text-white">
        <Trash2 onclick={() => handleDelete(asset)} 
          size={25} class="cursor-pointer m-1" />
      </div>
      {/snippet}
    </Dialog>

    {#if !isMarkdown && !isPdf}
      <img src={assetUrl} class="h-16 w-16 object-cover" alt={asset} />
    {/if}

    <div class="text-sm ml-2">
      <a 
        href={isMarkdown ? '/edit' + assetUrl : assetUrl} 
        class="hover:underline" 
        data-sveltekit-reload={isMarkdown}
      >
        {asset}
      </a>
    </div>
  </div>
{/snippet}