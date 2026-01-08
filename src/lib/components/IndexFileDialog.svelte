<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import { toast } from "svelte-sonner";
  import { FileUp } from "lucide-svelte";

  interface Props {
    open?: boolean;
    onSuccess?: (path: string) => void;
  }

  let { open = $bindable(false), onSuccess }: Props = $props();

  let filePath = $state("");
  let isIndexing = $state(false);
  let error = $state("");

  async function handleIndex(file: File) {
    error = "";
    isIndexing = true;

    try {
      const formData = new FormData();
      formData.append("fileToUpload", file);

      const response = await fetch("/admin/letta?/indexContent", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.type === "success") {
        toast.success(`File "${file.name}" indicizzato con successo in Letta`);
        open = false;
        onSuccess?.(file.name);
      } else {
        error =
          result.data?.error || "Errore durante l'indicizzazione del file";
        toast.error(error);
      }
    } catch (err) {
      error = "Errore di rete";
      toast.error(error);
      console.error("Error indexing file:", err);
    } finally {
      isIndexing = false;
    }
  }

  function handleCancel() {
    filePath = "";
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
      <FileUp class="h-5 w-5" />
      <span>Index File in Letta</span>
    </div>
  {/snippet}

  {#snippet description()}
    <div class="space-y-4 py-4">
      <p class="text-sm text-muted-foreground">
        Carica un file in Letta per renderlo interrogabile dall'AI. Il file NON
        sarà visualizzabile nel CMS.
      </p>

      <div class="space-y-2">
        <Label for="fileUpload">Seleziona File</Label>
        <Input
          id="fileUpload"
          type="file"
          disabled={isIndexing}
          onchange={(e) => {
            const files = e.currentTarget.files;
            if (files && files.length > 0) {
              // We just use this to trigger state update if needed
            }
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
              "fileUpload",
            ) as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
              handleIndex(fileInput.files[0]);
            } else {
              error = "Seleziona un file";
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
