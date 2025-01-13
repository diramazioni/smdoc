<script lang="ts">
  import Gallery from "$lib/components/Gallery.svelte";
  let { data } = $props()

</script>
<div class="fixed z-30 right-2 bottom-2">
  <div class="flex items-center m-5">  <img src="/logo.png" alt="logo" class="w-24 mr-4" /> <div> <h1 class="text-xl font-bold">DigitEco <span class="text-base font-normal">s.r.l.</span></h1> <h2 class="text-sm">Tecnologie ambientali e industriali</h2>
    </div>
  </div>
</div>
<Gallery links={data.links} />