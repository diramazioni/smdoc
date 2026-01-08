<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import { toast } from "svelte-sonner";
  import { FolderUp } from "lucide-svelte";

  interface Props {
    open?: boolean;
    onSuccess?: (path: string) => void;
  }

  let { open = $bindable(false), onSuccess }: Props = $props();

  let directoryPath = $state("");
  let isIndexing = $state(false);
  let error = $state("");

  async function handleIndex(files: FileList) {
    error = "";
    isIndexing = true;

    try {
      const formData = new FormData();
      formData.append("isDirectory", "on");
      // Use "filesToUpload" as key for all files
      for (let i = 0; i < files.length; i++) {
        formData.append("filesToUpload", files[i]);
      }

      const response = await fetch("/admin/letta?/indexContent", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.type === "success") {
        toast.success(
          `Directory indicizzata con successo (${files.length} file)`,
        );

        if (result.data?.results && result.data.results.length > 0) {
          toast.info(`${result.data.results.length} file indicizzati`);
        }

        open = false;
        onSuccess?.(files.length + " files");
      } else {
        error =
          result.data?.error ||
          "Errore durante l'indicizzazione della directory";
        toast.error(error);
      }
    } catch (err) {
      error = "Errore di rete";
      toast.error(error);
      console.error("Error indexing directory:", err);
    } finally {
      isIndexing = false;
    }
  }

  function handleCancel() {
    directoryPath = "";
    error = "";
    open = false;
  }
</script>

<Dialog bind:open>
  {#snippet trigger()}
    <!-- Trigger is handled externally -->
  {/snippet}

  {#snippet title()}
    <div class="flex items-center gap-2">
      <FolderUp class="h-5 w-5" />
      <span>Index Directory in Letta</span>
    </div>
  {/snippet}

  {#snippet description()}
    <div class="space-y-4 py-4">
      <p class="text-sm text-muted-foreground">
        Carica tutti i file in una directory in Letta per renderli interrogabili
        dall'AI. I file NON saranno visualizzabili nel CMS.
      </p>

      <div class="space-y-2">
        <Label for="directoryUpload">Seleziona Directory</Label>
        <!-- @ts-ignore -->
        <Input
          id="directoryUpload"
          type="file"
          webkitdirectory
          directory
          multiple
          disabled={isIndexing}
          onchange={(e) => {
            // Just trigger update
          }}
        />
        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={handleCancel} disabled={isIndexing}>
          Annulla
        </Button>
        <Button
          onclick={() => {
            const fileInput = document.getElementById(
              "directoryUpload",
            ) as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
              handleIndex(fileInput.files);
            } else {
              error = "Seleziona una directory";
            }
          }}
          disabled={isIndexing}
          class="bg-blue-600 hover:bg-blue-700"
        >
          {isIndexing ? "Caricamento..." : "Index"}
        </Button>
      </div>
    </div>
  {/snippet}
</Dialog>
