<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import { FilePlus } from "lucide-svelte";
  import slugify from "voca/slugify";
  import { toast } from "svelte-sonner";

  interface Props {
    open?: boolean;
    onConfirm: (
      title: string,
      slug: string,
      saveCurrent: boolean,
    ) => Promise<void>;
  }

  let { open = $bindable(false), onConfirm }: Props = $props();

  let titleValue = $state("");
  let saveCurrent = $state(false);
  let isProcessing = $state(false);

  let slug = $derived(slugify(titleValue));

  async function handleCreate() {
    console.log("CreateFileDialog: handleCreate called");
    if (!titleValue.trim()) {
      toast.error("Titolo obbligatorio");
      return;
    }
    isProcessing = true;
    console.log("CreateFileDialog: calling onConfirm", {
      titleValue,
      slug,
      saveCurrent,
    });
    try {
      await onConfirm(titleValue, slug, saveCurrent);
      console.log("CreateFileDialog: onConfirm finished successfully");
      open = false;
      titleValue = "";
    } catch (e) {
      console.error("CreateFileDialog: error in onConfirm", e);
      toast.error("Errore durante la creazione del file");
    } finally {
      isProcessing = false;
    }
  }
</script>

<Dialog bind:open>
  {#snippet trigger()}{/snippet}

  {#snippet title()}
    <div class="flex items-center gap-2">
      <FilePlus class="h-5 w-5" />
      <span>Nuovo Documento</span>
    </div>
  {/snippet}

  {#snippet description()}
    <div class="space-y-4 py-4 text-left">
      <div class="space-y-2">
        <Label for="new-title">Titolo</Label>
        <Input
          id="new-title"
          bind:value={titleValue}
          placeholder="Inserisci il titolo del documento..."
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleCreate();
            }
          }}
          disabled={isProcessing}
        />
      </div>

      <div class="space-y-2">
        <Label>Slug generato</Label>
        <div
          class="text-sm font-mono bg-muted p-2 rounded border truncate min-h-[40px] flex items-center"
        >
          {slug || "..."}
        </div>
      </div>

      <div class="flex items-center space-x-2 py-2">
        <Switch
          id="save-current"
          bind:checked={saveCurrent}
          disabled={isProcessing}
        />
        <Label for="save-current" class="cursor-pointer"
          >Salva il documento corrente prima di creare</Label
        >
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <!-- Not adding "Annulla" here because Dialog.svelte already has a Cancel/Close button -->
        <Button
          type="button"
          onclick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCreate();
          }}
          disabled={isProcessing || !titleValue.trim()}
          class="bg-green-600 hover:bg-green-700 min-w-[100px]"
        >
          {isProcessing ? "Creazione..." : "Crea"}
        </Button>
      </div>
    </div>
  {/snippet}
</Dialog>
