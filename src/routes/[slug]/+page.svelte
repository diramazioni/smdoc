<script lang="ts">
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Pencil} from 'lucide-svelte';

	let { data } = $props()
	let showEditDiv = $state(false);

</script>

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  {#if $page.data.user}
    <div id="content" class="m-4 cursor-pointer" 
    onclick={() => goto('/edit' + $page.url.pathname)}
    onmouseenter={() => showEditDiv = true} onmouseleave={() => showEditDiv = false} role="region">
      {#if showEditDiv}
        <div class="flex justify-center items-center">
          <div id="edit" class="absolute">
            <a href="/edit{$page.url.pathname}">
              <Pencil />
            </a>
          </div>
        </div>
      {/if}	

      <MarkdocRenderer children={JSON.parse(data.children)} />
	  
	  </div>
  {:else}
    <div id="content" class="m-4" >
      <MarkdocRenderer children={JSON.parse(data.children)} />
    </div>
  {/if}	

  {#if data.footer}
    <div id="footer" class="fixed bottom-0 left-0 right-0 ml-4 mr-4 p-2 w-full justify-center items-center text-center bg-white bg-opacity-80" >
      <MarkdocRenderer children={JSON.parse(data.footer)} />
    </div>
  {/if}	

  <style>
    #footer {
      
    }
  </style>