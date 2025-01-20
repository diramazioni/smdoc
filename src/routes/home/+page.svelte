<script lang="ts">
  import Gallery from "$lib/components/Gallery.svelte";
  let { data } = $props();
  let isCookiesOpen = $state(true);
  function toggleCookies() {
    isCookiesOpen = !isCookiesOpen;
  }
</script>
<div
class="absolute inset-0 bg-cover bg-no-repeat bg-center"
style="background-image: url('/bg-home.jpg');"
>
</div>
<div class="fixed z-30 right-2 bottom-2">
  <div class="flex items-center m-5">
    <img src="/logo.png" alt="logo" class="w-24 mr-4" />
    <div>
      <h1 class="text-xl font-bold">
        DigitEco <span class="text-base font-normal">s.r.l.</span>
      </h1>
      <h2 class="text-sm">Tecnologie ambientali e industriali</h2>
    </div>
  </div>
</div>
<!-- Cookies consent widget -->
 {#if isCookiesOpen}
<div id="cookie-banner" class="fixed bottom-4 left-4 right-4 lg:w-1/4 bg-white rounded-lg shadow-lg p-6 z-50 transition-opacity duration-300 ease-in-out" role="dialog" aria-modal="true" aria-label="Cookie Consent">
  <p class="text-sm text-center">digiteco.it usa i cookies. Proseguendo nella navigazione acconsenti al loro uso.</p>
  <div class="mt-4 flex justify-center space-x-2">
    <button 
    onclick={toggleCookies}
    id="accept-cookies" 
    class="bg-green-500 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-300">Accetta</button>
    <button id="more-info" class="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
      <a href="/privacy-policy" class="text-white hover:bg-blue-500">Maggiori informazioni</a>
    </button>
  </div>
</div>
{/if}
<!-- <Gallery links={data.links} /> -->
