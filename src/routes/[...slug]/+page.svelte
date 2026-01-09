<script lang="ts">
  import MarkdocRenderer from "$lib/markdoc/renderer.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Pencil } from "lucide-svelte";

  let { data } = $props();
  let showEditDiv = $state(false);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
{#if $page.data.user}
  <div
    id="content"
    class="m-4"
    onmouseenter={() => (showEditDiv = true)}
    onmouseleave={() => (showEditDiv = false)}
    role="region"
  >
    {#if showEditDiv}
      <div class="cursor-pointer flex justify-center items-center">
        <div
          id="edit"
          class="fixed top-30 hover:bg-blue-200 p-4 rounded-lg border"
        >
          <a
            href="/edit{$page.url.pathname}"
            onclick={() => goto("/edit" + $page.url.pathname)}
          >
            <Pencil size="40" />
          </a>
        </div>
      </div>
    {/if}

    <div class="prose max-w-none dark:prose-invert">
      <MarkdocRenderer children={JSON.parse(data.children)} />
    </div>
  </div>
{:else}
  <div id="content" class="m-4">
    <div class="prose max-w-none dark:prose-invert">
      <MarkdocRenderer children={JSON.parse(data.children)} />
    </div>
  </div>
{/if}

<style>
</style>
