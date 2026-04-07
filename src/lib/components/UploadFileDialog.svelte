<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Dialog from "$lib/components/Dialog.svelte";
  import { toast } from "svelte-sonner";
  import {
    FileUp,
    X,
    File as FileIcon,
    ArrowUpToLine,
    CheckCircle2,
  } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import { createUploadStore } from "$lib/stores/upload";
  import {
    MAX_FILE_SIZE,
    isAllowedFileType,
    getMimeTypeFromFilename,
  } from "$lib/config/files.types.ts";

  interface Props {
    open?: boolean;
    folder?: string;
  }

  let { open = $bindable(false), folder = "" }: Props = $props();

  const upload = createUploadStore();
  let fileInput: HTMLInputElement;
  let selectedFiles = $state<File[]>([]);
  let isUploading = $state(false);
  let uploadProgress = $state(0);

  $effect(() => {
    if ($upload.status === "uploading") {
      uploadProgress = $upload.progress;
    }
  });

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      selectedFiles = Array.from(input.files);
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    if (selectedFiles.length === 0 && fileInput) {
      fileInput.value = "";
    }
  }

  async function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `${file.name} is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
      return false;
    }

    const mimeType = getMimeTypeFromFilename(file.name);
    if (!mimeType || !isAllowedFileType(mimeType)) {
      toast.error(`${file.name}: Invalid file type`);
      return false;
    }

    try {
      const fullFileName = folder ? `${folder}/${file.name}` : file.name;
      const headers = {
        "x-file-name": fullFileName,
      };

      await upload.upload({
        file,
        url: "/api/upload",
        headers,
      });

      return $upload.status === "completed";
    } catch (err) {
      console.error(`Error uploading ${file.name}:`, err);
      return false;
    }
  }

  async function handleSubmit() {
    if (selectedFiles.length === 0) return;

    isUploading = true;
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        const success = await handleUpload(file);
        if (success) successCount++;
      }

      if (successCount === selectedFiles.length) {
        toast.success(`All ${successCount} files uploaded successfully`);
        handleClose();
        await invalidateAll();
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} of ${selectedFiles.length} files uploaded`,
        );
        // Keep the dialog open for failed files?
        // For simplicity, let's just clear successful ones or keep all
      }
    } finally {
      isUploading = false;
      uploadProgress = 0;
      upload.reset();
    }
  }

  function handleClose() {
    selectedFiles = [];
    if (fileInput) fileInput.value = "";
    open = false;
  }
</script>

<Dialog bind:open>
  {#snippet trigger()}
    <!-- Triggered externally -->
  {/snippet}

  {#snippet title()}
    <div class="flex items-center gap-2">
      <FileUp class="h-5 w-5 text-blue-500" />
      <span>Upload Assets</span>
    </div>
  {/snippet}

  {#snippet description()}
    <div class="space-y-4 py-4">
      <div
        class="flex flex-col gap-1 items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative"
      >
        <input
          bind:this={fileInput}
          type="file"
          multiple
          class="absolute inset-0 opacity-0 cursor-pointer"
          onchange={handleFileChange}
          disabled={isUploading}
          accept=".md,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
        />
        <div
          class="p-3 rounded-full bg-white shadow-sm border border-slate-100 mb-2"
        >
          <FileUp size={24} class="text-slate-400" />
        </div>
        <p class="text-sm font-medium text-slate-600">
          Click or drag files here to upload
        </p>
        <p class="text-xs text-slate-400">MD, PDF, or Images (Max 10MB)</p>
      </div>

      {#if selectedFiles.length > 0}
        <div class="max-h-[200px] overflow-y-auto space-y-2 pr-2">
          {#each selectedFiles as file, i}
            <div
              class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 group shadow-sm"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <FileIcon size={16} class="text-blue-500 shrink-0" />
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-medium text-slate-700 truncate"
                    >{file.name}</span
                  >
                  <span class="text-[10px] text-slate-400"
                    >{(file.size / 1024).toFixed(1)} KB</span
                  >
                </div>
              </div>
              <button
                onclick={() => removeFile(i)}
                disabled={isUploading}
                class="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      {#if isUploading}
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-slate-500 font-medium">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
        </div>
      {/if}

      <div class="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onclick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onclick={handleSubmit}
          disabled={isUploading || selectedFiles.length === 0}
          class="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] gap-2"
        >
          {#if isUploading}
            <div
              class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            Uploading...
          {:else}
            <ArrowUpToLine size={16} />
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
          {/if}
        </Button>
      </div>
    </div>
  {/snippet}
</Dialog>
