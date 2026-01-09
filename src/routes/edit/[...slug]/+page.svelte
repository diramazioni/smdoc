<script lang="ts">
  // UI
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import CreateDirectoryDialog from "$lib/components/CreateDirectoryDialog.svelte";
  import CreateFileDialog from "$lib/components/CreateFileDialog.svelte";
  import UploadFileDialog from "$lib/components/UploadFileDialog.svelte";
  import IndexFileDialog from "$lib/components/IndexFileDialog.svelte";
  import IndexDirectoryDialog from "$lib/components/IndexDirectoryDialog.svelte";

  import {
    Save,
    Eye,
    Copy,
    Plus,
    FileText,
    FolderPlus,
    FileUp,
    FolderUp,
  } from "lucide-svelte";
  // Utils
  import slugify from "voca/slugify";
  import { copy } from "svelte-copy";
  import { toast } from "svelte-sonner";
  // My component
  import MarkdocRenderer from "$lib/markdoc/renderer.svelte";
  // import { Editor, Viewer } from 'tui-editor-svelte';
  import TuiEditor from "$lib/components/Editor.svelte";
  import Crepe from "$lib/components/Crepe.svelte";
  import Assets from "$lib/components/Assets.svelte";
  import LettaChat from "$lib/components/LettaChat.svelte";
  import LettaStatus from "$lib/components/LettaStatus.svelte";
  // Svelte
  import { onDestroy, onMount, setContext } from "svelte";
  import { page } from "$app/stores";
  import { goto, invalidate, invalidateAll } from "$app/navigation";
  import { deserialize, enhance } from "$app/forms";

  let { data }: { data: any } = $props();

  let useTuiEditor = $state(false);
  let editorRef = $state<any>(); // Reference to store the editor instance
  let titleValue = $state("");
  let descriptionValue = $state("");
  let currentDocPath = $state(""); // Track navigated folder in Assets
  let slug = $derived(
    currentDocPath
      ? `${currentDocPath}/${slugify(titleValue)}`
      : slugify(titleValue),
  );
  let originalSlug = $state("");

  $effect(() => {
    titleValue = data.frontmatter?.title ?? "";
    descriptionValue = data.frontmatter?.description ?? "";
    originalSlug = data.slug;

    // Initialize currentDocPath from data.slug
    if (data.slug) {
      const parts = data.slug.split("/");
      parts.pop();
      currentDocPath = parts.join("/");
    }
  });

  $effect(() => {
    if (editorRef && data.md_only !== undefined) {
      editorRef.setMarkdown(data.md_only);
    }
  });

  let showChat = $state(false);

  let autoSaveDialog = $state(false);
  let showCreateDirectoryDialog = $state(false);
  let showCreateFileDialog = $state(false);
  let showRenameDialog = $state(false);
  let showUploadFileDialog = $state(false);
  let showIndexFileDialog = $state(false);
  let showIndexDirectoryDialog = $state(false);

  // Calcola la larghezza dinamica per il campo slug
  let slugWidth = $derived(Math.max(80, slug.length * 8 + 200));

  let interval: ReturnType<typeof setInterval>; // 30 seconds

  $effect(() => {
    interval = setInterval(() => {
      autoSaveDialog = true;
      console.log("save-e");
    }, 300000); // 5 min in milliseconds

    return () => clearInterval(interval);
  });

  async function handleSave(event?: Event) {
    if (event) event.preventDefault();

    // Check if slug has changed
    if (slug !== originalSlug && originalSlug !== "new-document") {
      showRenameDialog = true;
      return;
    }

    await performSave();
  }

  async function performSave(
    customSlug?: string,
    skipRedirect: boolean = false,
  ) {
    const targetSlug = customSlug || slug;
    autoSaveDialog = false;

    const formData = new FormData();
    formData.append("slug", targetSlug);
    formData.append("title", titleValue);
    formData.append("description", descriptionValue);
    formData.append("updatedContent", editorRef?.getMarkdown() || "");

    const response = await fetch("?/save", {
      method: "POST",
      body: formData,
      headers: { "x-sveltekit-action": "true" },
    });

    const result = deserialize(await response.text());

    if (result.type === "success") {
      toast.success(`${targetSlug} salvato`);
      // Non-blocking sync
      syncWithLetta("updated", {
        title: titleValue,
        slug: targetSlug,
        description: descriptionValue,
      });

      if (!skipRedirect) {
        await goto(`/edit/${targetSlug}`, { invalidateAll: true });
      }
      return true;
    } else {
      const errorMsg =
        (result.type === "failure" ? result.data?.error : result.message) ||
        "Errore sconosciuto";
      toast.error(`Errore salvataggio: ${errorMsg}`);
      return false;
    }
  }

  async function handleRename() {
    const updatedContent = editorRef?.getMarkdown();
    const formData = new FormData();
    formData.append("oldSlug", originalSlug);
    formData.append("newSlug", slug);
    formData.append("title", titleValue);
    formData.append("description", descriptionValue);
    formData.append("content", updatedContent);

    const response = await fetch("?/rename", {
      method: "POST",
      body: formData,
      headers: { "x-sveltekit-action": "true" },
    });
    const result = await response.json();
    if (result.type === "success") {
      toast.success("Document renamed successfully");
      showRenameDialog = false;
      originalSlug = slug;
      await goto(`/edit/${slug}`, { invalidateAll: true });
    } else {
      toast.error(`Error renaming document: ${result.message}`);
    }
  }

  async function handleSaveAs() {
    showRenameDialog = false;
    await performSave();
  }

  async function handleCreateConfirm(
    newTitle: string,
    newSlug: string,
    saveCurrent: boolean,
  ) {
    const formData = new FormData();
    formData.append("newTitle", newTitle);
    formData.append("newSlug", newSlug);
    formData.append("saveCurrent", saveCurrent.toString());

    if (saveCurrent) {
      formData.append("currentSlug", originalSlug);
      formData.append("currentTitle", titleValue);
      formData.append("currentDescription", descriptionValue);
      formData.append("currentContent", editorRef?.getMarkdown() || "");
    }

    const response = await fetch("?/create", {
      method: "POST",
      body: formData,
      headers: { "x-sveltekit-action": "true" },
    });

    const result = deserialize(await response.text());

    if (result.type === "success") {
      showCreateFileDialog = false;
      // We navigate to the NEW slug returned by the server
      const targetSlug =
        (result.type === "success" && result.data?.newSlug) || newSlug;
      await goto(`/edit/${targetSlug}`, { invalidateAll: true });
      toast.success(`Documento "${newTitle}" creato`);

      // Sync with Letta (non-blocking)
      syncWithLetta("created", { title: newTitle, slug: targetSlug });
    } else {
      const errorMsg =
        (result.type === "failure" ? result.data?.error : result.message) ||
        "Errore creazione";
      toast.error(`Errore creazione: ${errorMsg}`);
    }
  }

  async function syncWithLetta(
    action: "created" | "updated" | "deleted",
    metadata?: any,
  ) {
    try {
      await fetch("/api/letta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "smdr-main",
          slug: slug, // This is not the actual file path of the doc, but the doc slug is what matters for Letta
          // Actually, we should probably pass the full path if we want Letta to read it
          // For now using the slug as the identifier
          action,
          metadata,
        }),
      });
    } catch (error) {
      console.error("Letta sync failed:", error);
    }
  }

  function handleCreateDirectory() {
    showCreateDirectoryDialog = true;
  }

  function handleIndexFile() {
    showIndexFileDialog = true;
  }

  function handleIndexDirectory() {
    showIndexDirectoryDialog = true;
  }

  function scrollFixed(node: HTMLElement) {
    let originalTop: number;
    let originalWidth: number;

    function handleScroll() {
      if (!originalTop) {
        const rect = node.getBoundingClientRect();
        originalTop = rect.top + window.scrollY;
        originalWidth = rect.width;
      }

      if (window.scrollY > originalTop) {
        node.classList.add("fixed", "top-0");
      } else {
        node.classList.remove("fixed", "top-0");
      }
    }

    document.addEventListener("scroll", handleScroll);

    return {
      destroy() {
        document.removeEventListener("scroll", handleScroll);
      },
    };
  }
</script>

<Dialog bind:open={autoSaveDialog}>
  {#snippet trigger()}
    <!-- <Save size={15} class="cursor-pointer m-1" 
      onclick={() => handleSave(event) } /> -->
  {/snippet}

  {#snippet title()}
    Save ?
  {/snippet}

  {#snippet description()}
    <p class="mb-4">Save the changes?</p>
    <Button class="w-full" onclick={(e) => handleSave(e)}>
      <Save size={15} class="mr-2" />
      Save
    </Button>
  {/snippet}
</Dialog>

<!-- Confirmation dialog before clearing fields -->
<CreateFileDialog
  bind:open={showCreateFileDialog}
  onConfirm={handleCreateConfirm}
  parentPath={currentDocPath}
/>

<!-- Rename vs Save As dialog -->
<Dialog bind:open={showRenameDialog}>
  {#snippet trigger()}{/snippet}
  {#snippet title()}
    Rinominare o Salvare come nuovo?
  {/snippet}

  {#snippet description()}
    <p class="mb-4">
      Hai cambiato il titolo (e lo slug). Vuoi rinominare il file esistente o
      crearne uno nuovo (Save As)?
    </p>
    <div class="flex justify-end gap-2">
      <Button
        variant="outline"
        onclick={() => {
          showRenameDialog = false;
        }}
      >
        Annulla
      </Button>
      <Button variant="default" onclick={handleRename}>Rinomina</Button>
      <Button class="bg-green-600 hover:bg-green-700" onclick={handleSaveAs}>
        Salva come nuovo
      </Button>
    </div>
  {/snippet}
</Dialog>

<!-- Create Directory Dialog -->
<CreateDirectoryDialog bind:open={showCreateDirectoryDialog} />

<UploadFileDialog
  bind:open={showUploadFileDialog}
  folder={data.slug.split("/").slice(0, -1).join("/")}
/>

<!-- Index Dialogs -->
<IndexFileDialog bind:open={showIndexFileDialog} />
<IndexDirectoryDialog bind:open={showIndexDirectoryDialog} />

{#snippet metaForm()}
  <div class="w-full bg-muted p-2 -mt-2">
    <div class="flex max-w-full items-center m-4 space-x-3">
      <Label for="title">Title</Label>
      <Input
        type="text"
        name="title"
        placeholder="Title"
        bind:value={titleValue}
      />

      <button
        type="button"
        use:copy={`/${slug}`}
        onclick={() => {
          toast.success(`/${slug} Link copied to clipboard`);
        }}
      >
        <Copy />
      </button>
      <Input
        type="text"
        name="slug_view"
        disabled
        value={slug}
        style="width: {slugWidth}px; min-width: 80px; max-width: 400px;"
      />
      <input name="slug" hidden value={slug} />
      <Label for="description">Description</Label>
      <Input
        type="text"
        name="description"
        placeholder="Description"
        bind:value={descriptionValue}
      />
    </div>
  </div>
{/snippet}

{#snippet cmdMenu()}
  <div
    id="cmdMenu"
    class="relative z-10 flex w-full justify-between items-center"
  >
    <div class="flex items-center space-x-3">
      <Button class="menu" type="button" variant="outline" onclick={handleSave}>
        <Save />
      </Button>
      <Button
        href={$page.url.pathname.replace("/edit", "")}
        class="menu"
        type="button"
        variant="outline"
      >
        <Eye />
      </Button>
    </div>
    <div class="flex items-center space-x-3">
      <div>
        <!-- switch editor-->
        <Label for="editor">
          {#if useTuiEditor}
            Tui Editor
          {:else}
            Crepe Editor
          {/if}
        </Label>
        <Switch class="mt-2" bind:checked={useTuiEditor} />
        <!-- switch editor-->
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
        >
          <Plus />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={() => (showCreateFileDialog = true)}>
            <FileText class="mr-2 h-4 w-4" />
            Nuovo documento
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={handleCreateDirectory}>
            <FolderPlus class="mr-2 h-4 w-4" />
            Nuova directory
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => (showUploadFileDialog = true)}>
            <FileUp class="mr-2 h-4 w-4" />
            Carica documento o Asset
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={handleIndexFile}>
            <FileUp class="mr-2 h-4 w-4" />
            Index File
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={handleIndexDirectory}>
            <FolderUp class="mr-2 h-4 w-4" />
            Index Directory
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/snippet}
{#snippet tuiEditor()}
  <div class="mt-2">
    <TuiEditor
      bind:this={editorRef}
      initialValue={data.md_only}
      pluginsOn={["tableMergedCell", "codeSyntaxHighlight", "chart", "uml"]}
    />
  </div>
{/snippet}

{#snippet crepeEditor()}
  <Crepe bind:this={editorRef} markdown={data.md_only} />
{/snippet}
<Separator class="mt-2" />

{@render metaForm()}

{@render cmdMenu()}
<Resizable.PaneGroup
  direction="horizontal"
  class="h-full w-full rounded-lg border relative "
>
  <Resizable.Pane defaultSize={80}>
    {#if useTuiEditor}
      {@render tuiEditor()}
    {:else}
      {@render crepeEditor()}
    {/if}
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane defaultSize={20}>
    <div class="min-w-96 max-w-[600px] flex flex-col gap-4" use:scrollFixed>
      <Assets bind:editorRef bind:currentDocPath />
      <div class="px-4">
        <LettaStatus
          userId={data.user?.name || "anonymous"}
          projectId="smdr-main"
        />
      </div>
    </div>
  </Resizable.Pane>
</Resizable.PaneGroup>

<!-- Letta Chat Floating Toggle -->
<div class="fixed bottom-6 left-6 z-50">
  <Button
    onclick={() => (showChat = !showChat)}
    variant={showChat ? "destructive" : "default"}
    class="rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-transform flex items-center justify-center p-0"
  >
    {#if showChat}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    {/if}
  </Button>
</div>

{#if showChat}
  <div
    class="fixed bottom-24 left-6 w-[450px] z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5 duration-300"
  >
    <div class="h-[550px]">
      <LettaChat
        userId={data.user?.name || "anonymous"}
        projectId="smdr-main"
      />
    </div>
  </div>
{/if}
