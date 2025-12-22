<script lang="ts">
  import Gallery from "$lib/components/Gallery.svelte";
  let { data } = $props()

</script>
<div class="fixed z-30 right-2 bottom-2">
</div>
<Gallery links={data.links} />