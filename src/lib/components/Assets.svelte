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
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import type { AssetInfo } from "$lib/api";

  let {
    editorRef = $bindable(),
    currentDocPath = $bindable(""),
  }: { editorRef: any; currentDocPath?: string } = $props();

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
  let assetToRename = $state<AssetInfo | null>(null);
  let newName = $state("");

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
          currentDocPath = dir;
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

  async function handleRename() {
    if (!assetToRename || !newName) return;

    const parts = assetToRename.path.split("/");
    parts.pop();
    const parentDir = parts.join("/");
    const newPath = parentDir ? `${parentDir}/${newName}` : newName;

    const res = await fetch("/api/assets/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldPath: assetToRename.path,
        newPath: newPath,
      }),
    });

    if (res.ok) {
      toast.success("Renamed successfully");
      assetToRename = null;
      newName = "";
      fetchAssets(tabState, currentPaths[tabState]);
    } else {
      toast.error("Failed to rename");
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
    if (tabState === "md") {
      currentDocPath = path;
    }
    fetchAssets(tabState, path);
  }

  function goBack() {
    const parts = currentPaths[tabState].split("/");
    parts.pop();
    const parentPath = parts.join("/");
    currentPaths[tabState] = parentPath;
    if (tabState === "md") {
      currentDocPath = parentPath;
    }
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
        <div class="flex items-center">
          <Tooltip.Root>
            <Tooltip.Trigger>
              <button
                onclick={() => {
                  assetToRename = asset;
                  newName = asset.name;
                }}
              >
                <FilePenLine size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Rename directory</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              <button onclick={() => (fileToDelete = asset)}>
                <Trash2 size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Delete directory</Tooltip.Content>
          </Tooltip.Root>
        </div>
        <button
          class="flex flex-1 items-center gap-2 p-1 text-left"
          onclick={() => enterDirectory(asset.path)}
        >
          <Folder size={20} class="text-blue-500" />
          <span class="font-medium">{asset.name}</span>
        </button>
      {:else}
        <div class="flex items-center">
          <Tooltip.Root>
            <Tooltip.Trigger>
              <button
                onclick={() => {
                  assetToRename = asset;
                  newName = asset.name;
                }}
              >
                <FilePenLine size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Rename file</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              <button use:copy={assetUrl} onclick={() => insertAsset(asset)}>
                <Link size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Insert into editor</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              <button
                use:copy={assetUrl}
                onclick={() => {
                  toast.success(`${asset.name} Link copied to clipboard`);
                }}
              >
                <Copy size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Copy link to clipboard</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              <button onclick={() => (fileToDelete = asset)}>
                <Trash2 size={15} class="cursor-pointer m-1" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Delete file</Tooltip.Content>
          </Tooltip.Root>
        </div>

        {#if !isMarkdown && !isPdf}
          <img
            src={assetUrl}
            class="h-10 w-10 object-cover ml-2"
            alt={asset.name}
          />
        {/if}

        <div class="text-sm ml-2 flex-1 truncate">
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
    {#snippet title()}
      Delete {fileToDelete?.name}?
    {/snippet}
    {#snippet description()}
      <p>
        This will permanently delete the {fileToDelete?.isDir
          ? "directory"
          : "asset"}.
        {#if fileToDelete?.isDir && !fileToDelete?.isEmpty}
          <span class="text-red-500 font-bold block mt-2">
            Warning: This directory is not empty. All contents will be deleted!
          </span>
        {/if}
        Are you sure you want to continue?
      </p>
      <div
        class="m-auto w-full flex justify-center hover:bg-red-500 hover:text-white mt-4"
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

<!-- Rename Dialog -->
{#if assetToRename}
  <Dialog open={!!assetToRename} onOpenChange={() => (assetToRename = null)}>
    {#snippet title()}
      Rename {assetToRename?.name}
    {/snippet}
    {#snippet description()}
      <div class="space-y-4">
        <input
          type="text"
          bind:value={newName}
          class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 transition-all text-sm mt-2"
          placeholder="New name..."
        />
        <div class="flex justify-end gap-2 mt-4">
          <button
            onclick={() => (assetToRename = null)}
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onclick={handleRename}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all shadow-sm"
          >
            Rename
          </button>
        </div>
      </div>
    {/snippet}
  </Dialog>
{/if}
