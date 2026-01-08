<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import { toast } from "svelte-sonner";
  import { FolderPlus } from "lucide-svelte";
  import { deserialize } from "$app/forms";
  import type { ActionResult } from "@sveltejs/kit";

  interface Props {
    open?: boolean;
    onSuccess?: (path: string) => void;
  }

  let { open = $bindable(false), onSuccess }: Props = $props();

  let directoryName = $state("");
  let isCreating = $state(false);
  let error = $state("");

  async function handleCreate() {
    error = "";

    if (!directoryName.trim()) {
      error = "Il nome della directory è obbligatorio";
      return;
    }

    // Validazione client-side
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(directoryName)) {
      error = "Il nome contiene caratteri non validi";
      return;
    }

    if (
      directoryName.includes("..") ||
      directoryName.includes("/") ||
      directoryName.includes("\\")
    ) {
      error = "Il nome non può contenere separatori di percorso";
      return;
    }

    isCreating = true;

    try {
      const formData = new FormData();
      formData.append("directoryName", directoryName.trim());

      const response = await fetch("?/createDirectory", {
        method: "POST",
        body: formData,
        headers: {
          "x-sveltekit-action": "true",
        },
      });

      const result: ActionResult = deserialize(await response.text());
      console.log("Directory creation result:", result);

      if (result.type === "success") {
        const data = result.data as {
          success: boolean;
          path?: string;
          error?: string;
        };

        if (data.success && data.path) {
          toast.success(`Directory "${directoryName}" creata con successo`);

          // Sincronizza con Letta
          try {
            await fetch("/api/letta/sync-directory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: "smdr-main",
                directoryPath: data.path,
                action: "created",
              }),
            });
          } catch (lettaError) {
            console.error("Letta sync failed:", lettaError);
          }

          directoryName = "";
          open = false;
          onSuccess?.(data.path);
        } else {
          error = data.error || "Errore durante la creazione della directory";
          toast.error(error);
          console.error("Directory creation data indicates failure:", data);
        }
      } else if (result.type === "failure") {
        const data = result.data as { error?: string };
        error = data?.error || "Errore durante la creazione della directory";
        toast.error(error);
        console.error("Form action failed:", result);
      } else if (result.type === "error") {
        error = "Errore del server";
        toast.error(error);
        console.error("Server error:", result);
      } else {
        error = "Risposta non valida dal server";
        toast.error(error);
        console.error("Unexpected response structure:", result);
      }
    } catch (err) {
      error = "Errore di rete";
      toast.error(error);
      console.error("Error creating directory:", err);
    } finally {
      isCreating = false;
    }
  }

  function handleCancel() {
    directoryName = "";
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
      <FolderPlus class="h-5 w-5" />
      <span>Nuova Directory</span>
    </div>
  {/snippet}

  {#snippet description()}
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="directoryName">Nome Directory</Label>
        <Input
          id="directoryName"
          bind:value={directoryName}
          placeholder="es: documentazione"
          disabled={isCreating}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              handleCreate();
            }
          }}
        />
        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={handleCancel} disabled={isCreating}>
          Annulla
        </Button>
        <Button
          onclick={handleCreate}
          disabled={isCreating}
          class="bg-green-600 hover:bg-green-700"
        >
          {isCreating ? "Creazione..." : "Crea"}
        </Button>
      </div>
    </div>
  {/snippet}
</Dialog>
