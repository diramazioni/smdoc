<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  let { data } = $props();

  let isCookiesOpen = $state(true);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    const consent = localStorage.getItem("cookie-consent");
    if (consent) isCookiesOpen = false;
  });

  function acceptCookies() {
    isCookiesOpen = false;
    localStorage.setItem("cookie-consent", "true");
  }
</script>

<div class="relative min-h-screen w-full overflow-hidden font-sans">
  <!-- Background Image with Overlay -->
  <div
    class="absolute inset-0 bg-cover bg-no-repeat bg-center transition-transform duration-[10s] ease-linear hover:scale-110"
    style="background-image: url('/bg-home.jpg');"
  >
    <div
      class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/70"
    ></div>
  </div>

  <!-- Hero Content -->
  {#if mounted}
    <div
      class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
    >
      <div in:fly={{ y: 50, duration: 1000, delay: 200 }} class="max-w-4xl">
        <h1
          class="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-2xl"
        >
          Innovazione al servizio <br />
          <span class="text-blue-400">dell'ambiente</span>
        </h1>
        <p
          class="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg"
        >
          Sistemi avanzati di monitoraggio e tecnologie industriali per un
          futuro sostenibile.
        </p>

        <div class="flex flex-col md:flex-row gap-4 justify-center">
          <a
            href="/servizi"
            class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 shadow-xl no-underline"
          >
            I Nostri Servizi
          </a>
          <a
            href="/contatti"
            class="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 rounded-full font-semibold transition-all transform hover:scale-105 no-underline"
          >
            Contattaci
          </a>
        </div>
      </div>
    </div>
  {/if}

  <!-- Company Footer Info -->
  <div
    class="absolute z-20 bottom-8 left-8 right-8 flex flex-col md:flex-row items-center justify-between pointer-events-none"
  >
    <div in:fade={{ delay: 1000 }} class="flex items-center space-x-6">
      <div class="bg-white/90 p-3 rounded-xl shadow-2xl pointer-events-auto">
        <img src="/logo.png" alt="logo" class="h-12 w-auto" />
      </div>
      <div class="text-white drop-shadow-md">
        <h3 class="text-xl font-bold m-0">
          DigitEco <span class="font-light opacity-80">s.r.l.</span>
        </h3>
        <p class="text-sm m-0 opacity-80">
          Tecnologie ambientali e industriali
        </p>
      </div>
    </div>

    <div
      in:fade={{ delay: 1200 }}
      class="hidden md:block text-white/60 text-sm mt-4 md:mt-0"
    >
      &copy; {new Date().getFullYear()} DigitEco s.r.l. • Tutti i diritti riservati
    </div>
  </div>

  <!-- Cookie Banner -->
  {#if isCookiesOpen}
    <div
      transition:fly={{ y: 100, duration: 500 }}
      class="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md md:right-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 z-50 border border-white/20"
    >
      <div class="flex items-start space-x-4">
        <div class="bg-blue-100 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-gray-900 font-bold mb-1 mt-0">
            Informativa sui Cookie
          </h4>
          <p class="text-gray-600 text-sm m-0 leading-snug">
            Utilizziamo i cookie per migliorare la tua esperienza sul nostro
            sito. Continuando a navigare, accetti la nostra politica.
          </p>
          <div class="mt-4 flex items-center space-x-3">
            <button
              onclick={acceptCookies}
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Accetta
            </button>
            <a
              href="/privacy-policy"
              class="text-gray-500 hover:text-gray-800 text-xs font-medium no-underline"
            >
              Leggi di più
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }
</style>
