<script lang='ts'>
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { ArrowUpToLine } from 'lucide-svelte';
    
  let files =  $state();
</script>
    
<Accordion.Root type="single">
  <Accordion.Item value="uploads">
    <Accordion.Trigger class="ml-4 bg-slate-100 p-4">Upload assets</Accordion.Trigger>
    <Accordion.Content>
      <form action="?/upload" method="POST" enctype="multipart/form-data">
        <div class="flex max-w-full items-center m-4 space-x-3">
          <Button class="menu" type="submit" variant="secondary">
            <ArrowUpToLine />
          </Button>
          <input bind:files multiple type="file" name="file" placeholder="file" required/>
          {#if files}
            <div class="flex-col">
              {#each Array.from(files) as file}
              <div>
                <span class="text-sm">{file.name}</span> <span class="text-sm">({file.size} bytes)</span>
              </div>
              {/each}
            </div>
          {/if}
        </div>
      </form>  
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>