<script lang="ts">
  import Gallery from "$lib/components/Gallery.svelte";
  let { data } = $props()

</script>
<div class="text-center m-5">
  <h1 class="">Società Acquedotto <br>Valle del Lamone s.r.l.</h1>
</div>
<Gallery links={data.links} />