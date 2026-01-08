<script lang="ts">
  import { untrack } from "svelte";
  import { copy } from "svelte-copy";
  import { toast } from "svelte-sonner";
  import { page } from "$app/stores";
  import {
    Folder,
    File,
    ChevronLeft,
    Copy,
    Link,
    FilePenLine,
    ImageUp,
    Trash2,
  } from "lucide-svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import type { AssetInfo } from "$lib/api";

  let { editorRef = $bindable() }: { editorRef: any } = $props();

  // State management with runes
  let tabState = $state("md");
  let currentPaths = $state<Record<string, string>>({
    md: "",
    pdf: "",
    img: "",
  });
  let listAssets = $state<AssetInfo[]>([]);
  let searchQuery = $state("");
  let fileToDelete = $state<AssetInfo | null>(null);

  // Derived values
  let filteredItems = $derived(
    listAssets
      .filter((item: AssetInfo) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      }),
  );

  // Effects
  let lastSyncedSlug = $state("");

  $effect.pre(() => {
    // Sync with current slug on initial load or slug change
    const slug = $page.data.slug;
    if (slug && tabState === "md" && slug !== lastSyncedSlug) {
      const parts = slug.split("/");
      parts.pop(); // Remove filename
      const dir = parts.join("/");

      // Use untrack to avoid re-triggering this effect when currentPaths changes
      // or causing infinite loops if currentPaths were to change elsewhere
      untrack(() => {
        if (dir !== currentPaths.md) {
          currentPaths.md = dir;
        }
        lastSyncedSlug = slug;
      });
    }
  });

  $effect(() => {
    // Re-run whenever tabState, currentPath OR page data refreshes
    const _data = $page.data;
    fetchAssets(tabState, currentPaths[tabState]);
  });

  async function fetchAssets(type: string, path: string) {
    const res = await fetch(
      `/api/assets?type=${type}&path=${encodeURIComponent(path)}`,
    );
    if (res.ok) {
      listAssets = await res.json();
    }
  }

  async function handleDelete(asset: AssetInfo) {
    const formData = new FormData();
    formData.append("file_name", asset.path);

    let response = await fetch("/api/upload", {
      method: "DELETE",
      body: formData,
    });

    if (response.ok) {
      listAssets = listAssets.filter((item) => item.path !== asset.path);
      fileToDelete = null;
      toast.success(`${asset.name} deleted`);
    } else {
      toast.error(`Failed to delete ${asset.name}`);
    }
  }

  function getAssetUrl(asset: AssetInfo): string {
    if (asset.path.endsWith(".md")) {
      // Strip .md for routing if needed, but here we want the logical URL
      return `/${asset.path.slice(0, -3)}`;
    }
    return `/assets/${asset.path}`;
  }

  function insertAsset(asset: AssetInfo) {
    if (!editorRef) return;
    const assetUrl = getAssetUrl(asset);
    if (asset.path.endsWith(".md") || asset.path.endsWith(".pdf")) {
      editorRef.insertMarkdown(`[${asset.name}](${assetUrl})`);
    } else {
      editorRef.insertMarkdown(`![${asset.name}](${assetUrl})`);
    }
  }

  function enterDirectory(path: string) {
    currentPaths[tabState] = path;
    fetchAssets(tabState, path);
  }

  function goBack() {
    const parts = currentPaths[tabState].split("/");
    parts.pop();
    const parentPath = parts.join("/");
    currentPaths[tabState] = parentPath;
    fetchAssets(tabState, parentPath);
  }
</script>

<Tabs.Root
  bind:value={tabState}
  onValueChange={(v) => {
    tabState = v;
    fetchAssets(v, currentPaths[v]);
  }}
>
  <Tabs.List class="grid grid-cols-3">
    <Tabs.Trigger value="md">
      <FilePenLine />
    </Tabs.Trigger>
    <Tabs.Trigger value="pdf">
      <img src="/pdf-icon.svg" class="h-6 w-8" alt="pdf" />
    </Tabs.Trigger>
    <Tabs.Trigger value="img">
      <ImageUp />
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="md">
    {@render assetList(filteredItems)}
  </Tabs.Content>
  <Tabs.Content value="pdf">
    {@render assetList(filteredItems)}
  </Tabs.Content>
  <Tabs.Content value="img">
    {@render assetList(filteredItems)}
  </Tabs.Content>
</Tabs.Root>

{#snippet assetList(items: AssetInfo[])}
  <div class="px-4 py-2 mt-2">
    <input
      type="text"
      placeholder="Search assets..."
      bind:value={searchQuery}
      class="w-full px-4 py-2 border bg-slate-100/50 border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
    />
  </div>

  <div
    class="flex items-center gap-2 px-4 py-2 mb-1 bg-slate-50 border-y border-slate-200"
  >
    <button
      onclick={goBack}
      disabled={!currentPaths[tabState]}
      class="p-1.5 rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none transition-all"
      title="Back"
    >
      <ChevronLeft size={18} />
    </button>

    <div class="flex items-center gap-1 overflow-hidden">
      <div
        class="flex items-center text-xs font-medium text-slate-500 shrink-0"
      >
        <Folder size={14} class="mr-1.5 text-blue-500/70" />
        <button
          class="hover:text-blue-600 hover:underline"
          onclick={() => enterDirectory("")}
        >
          root
        </button>
      </div>

      {#if currentPaths[tabState]}
        {#each currentPaths[tabState].split("/") as part, i}
          <span class="text-slate-300">/</span>
          <button
            class="text-xs font-medium text-slate-600 truncate hover:text-blue-600 hover:underline"
            onclick={() => {
              const path = currentPaths[tabState]
                .split("/")
                .slice(0, i + 1)
                .join("/");
              enterDirectory(path);
            }}
          >
            {part}
          </button>
        {/each}
      {/if}
    </div>
  </div>

  {#if items.length > 0}
    <ScrollArea class="h-[550px] w-full p-4 pt-2">
      <div class="space-y-1">
        {#each items as asset}
          {@render assetItem(asset)}
        {/each}
      </div>
    </ScrollArea>
  {:else}
    <div
      class="text-center text-slate-400 py-12 flex flex-col items-center gap-2"
    >
      <Folder size={32} class="opacity-20" />
      <p class="text-sm">Empty directory</p>
    </div>
  {/if}
{/snippet}

{#snippet assetItem(asset: AssetInfo)}
  {@const assetUrl = getAssetUrl(asset)}
  {@const isMarkdown = asset.path.endsWith(".md")}
  {@const isPdf = asset.path.endsWith(".pdf")}
  {@const isTemplate = asset.path === "_templates/new.md"}

  {#if !isTemplate}
    <div
      class="flex items-center border bg-muted hover:bg-primary-foreground text-muted-foreground my-2 p-1"
    >
      {#if asset.isDir}
        <button
          class="flex flex-1 items-center gap-2 p-1 text-left"
          onclick={() => enterDirectory(asset.path)}
        >
          <Folder size={20} class="text-blue-500" />
          <span class="font-medium">{asset.name}</span>
        </button>
      {:else}
        <div class="flex items-center">
          <button use:copy={assetUrl} onclick={() => insertAsset(asset)}>
            <Link size={15} class="cursor-pointer m-1" />
          </button>
          <button
            use:copy={assetUrl}
            onclick={() => {
              toast.success(`${asset.name} Link copied to clipboard`);
            }}
          >
            <Copy size={15} class="cursor-pointer m-1" />
          </button>

          <button onclick={() => (fileToDelete = asset)}>
            <Trash2 size={15} class="cursor-pointer m-1" />
          </button>
        </div>

        {#if !isMarkdown && !isPdf}
          <img
            src={assetUrl}
            class="h-10 w-10 object-cover ml-2"
            alt={asset.name}
          />
        {/if}

        <div class="text-sm ml-2 flex-1">
          <a
            href={isMarkdown ? "/edit" + assetUrl : assetUrl}
            class="hover:underline"
            data-sveltekit-reload={isMarkdown}
          >
            {asset.name}
          </a>
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

<!-- Delete Confirmation Dialog -->
{#if fileToDelete}
  <Dialog open={!!fileToDelete} onOpenChange={() => (fileToDelete = null)}>
    {#snippet trigger()}open
    {/snippet}
    {#snippet title()}
      Delete {fileToDelete?.name}?
    {/snippet}
    {#snippet description()}
      <p>
        This will permanently delete the asset. Are you sure you want to
        continue?
      </p>
      <div
        class="m-auto w-full flex justify-center hover:bg-red-500 hover:text-white"
      >
        <button
          onclick={() => fileToDelete && handleDelete(fileToDelete)}
          class="cursor-pointer p-2 rounded-md"
        >
          <Trash2 size={25} class="m-1" />
        </button>
      </div>
    {/snippet}
  </Dialog>
{/if}
