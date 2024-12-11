<script lang="ts">
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Pencil} from 'lucide-svelte';
  import Guestbook from '$lib/components/Guestbook.svelte';

	let { data } = $props()
	let showEditDiv = $state(false);

  import MapLibre from 'svelte-maplibre/MapLibre.svelte';
  import DefaultMarker from 'svelte-maplibre/DefaultMarker.svelte';
  // import { mapClasses } from '../styles';
  // import code from './+page.svelte?raw';
  // import CodeSample from '$site/CodeSample.svelte';
  import Popup from 'svelte-maplibre/Popup.svelte';

  const {lngLat, name} = {
    lngLat: [11.609026 , 44.072771],
    name: 'Savl s.r.l. - Via Dino Campana 16, 50034 Marradi (FI), Italy'
  }
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
  <div id="map" class="m-4" >
    <MapLibre
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    class=" aspect-[9/16] max-h-[600px] w-full"
    standardControls
    zoom={15}
    center={lngLat}
  >
    <!-- {#each markers as { lngLat, name }} -->
      <DefaultMarker {lngLat}>
        <Popup offset={[0, -10]}>
          <div class="text-lg font-bold">{name}</div>
        </Popup>
      </DefaultMarker>
    <!-- {/each} -->
    </MapLibre>
  </div>
  <section class="mx-4 m-10">
    <h2 class="text-2xl font-semibold mb-6 text-center">Guestbook</h2>
    <Guestbook />
    <section class="m-10">
      &nbsp;
    </section>
  </section>


  <style>
  :global(.map) {
    height: 500px;
  }

  </style>