<script lang="ts">
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { ArrowUpToLine } from 'lucide-svelte';
  import { createUploadStore } from '$lib/stores/upload';
  import { MAX_FILE_SIZE, isAllowedFileType, getMimeTypeFromFilename } from '$lib/config/files.types.ts';
  import { toast } from "svelte-sonner";
  import { invalidateAll } from '$app/navigation';

  const upload = createUploadStore();
  let files = $state<FileList | null>(null);
  let isUploading = $state(false);
  let uploadProgress = $state(0);

  $effect(() => {
    if ($upload.status === 'uploading') {
      uploadProgress = $upload.progress;
    }
  });

  async function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return false;
    }

    const mimeType = getMimeTypeFromFilename(file.name);
    if (!mimeType || !isAllowedFileType(mimeType)) {
      toast.error('Invalid file type');
      return false;
    }

    try {
      const headers = {
        'x-file-name': file.name
      };

      await upload.upload({
        file,
        url: '/api/upload',
        headers
      });

      if ($upload.status === 'completed') {
        toast.success(`${file.name} uploaded successfully`);
        return true;
      } else {
        toast.error(`Failed to upload ${file.name}`);
        return false;
      }
    } catch (err) {
      toast.error(`Error uploading ${file.name}`);
      return false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!files?.length) return;
    
    isUploading = true;
    
    try {
      for (const file of Array.from(files)) {
        await handleUpload(file);
      }
      
      files = null;
      await invalidateAll();
    } finally {
      isUploading = false;
      uploadProgress = 0;
      upload.reset();
    }
  }
</script>

<Accordion.Root type="single">
  <Accordion.Item value="uploads">
    <Accordion.Trigger class="ml-4 bg-slate-100 p-4">Upload assets</Accordion.Trigger>
    <Accordion.Content>
      <form 
        onsubmit={handleSubmit} 
        class="flex max-w-full items-center m-4 space-x-3"
      >
        <Button 
          class="menu" 
          type="submit" 
          variant="secondary" 
          disabled={isUploading || !files?.length}
        >
          <ArrowUpToLine />
          {#if isUploading}
            {uploadProgress}%
          {/if}
        </Button>

        <input 
          bind:files 
          multiple 
          type="file" 
          name="file" 
          placeholder="file" 
          accept=".md,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          disabled={isUploading}
        />

        {#if files}
          <div class="flex-col">
            {#each Array.from(files) as file}
              <div>
                <span class="text-sm">{file.name}</span>
                <span class="text-sm">({Math.round(file.size / 1024)} KB)</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if isUploading}
          <progress value={uploadProgress} max="100" class="w-full" ></progress>
        {/if}
      </form>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>