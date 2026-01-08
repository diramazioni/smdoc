<script lang="ts">
  import { enhance } from "$app/forms";
  import LettaStatus from "$lib/components/LettaStatus.svelte";
  import { toast } from "svelte-sonner";

  let { data, form } = $props();

  let isSyncing = $state(false);

  $effect(() => {
    if (form?.success) {
      toast.success(form.message);
    } else if (form?.error) {
      toast.error(form.error);
    }
  });
</script>

<div class="max-w-4xl mx-auto p-8">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
      Letta Administration
    </h1>
    <a
      href="/edit/home"
      class="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Torna all'Editor
    </a>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Configuration Section -->
    <div class="md:col-span-2 space-y-8">
      <!-- API Key Form -->
      <section
        class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
      >
        <h2
          class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Configurazione Letta
        </h2>
        <form method="POST" action="?/saveConfig" use:enhance class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                for="apiKey"
                class="block text-sm font-semibold text-gray-700"
                >LETTA_API_KEY</label
              >
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={data.apiKey}
                placeholder="Letta API Key..."
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>

            <div class="space-y-2">
              <label
                for="baseUrl"
                class="block text-sm font-semibold text-gray-700"
                >LETTA_BASE_URL</label
              >
              <input
                type="text"
                id="baseUrl"
                name="baseUrl"
                value={data.baseUrl}
                placeholder="https://api.letta.com"
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>

            <div class="space-y-2">
              <label
                for="projectId"
                class="block text-sm font-semibold text-gray-700"
                >LETTA_PROJECT_ID</label
              >
              <input
                type="text"
                id="projectId"
                name="projectId"
                value={data.projectId}
                placeholder="smdr-main"
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>

            <div class="space-y-2">
              <label
                for="openaiKey"
                class="block text-sm font-semibold text-gray-700"
                >OPENAI_API_KEY (Optional)</label
              >
              <input
                type="password"
                id="openaiKey"
                name="openaiKey"
                value={data.openaiKey}
                placeholder="OpenAI API Key (per Self-hosted)..."
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>
          </div>

          <div class="pt-2 border-t border-gray-100">
            <button
              type="submit"
              class="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              Salva Configurazione
            </button>
          </div>
        </form>
      </section>

      <!-- Sync Section -->
      <section
        class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative"
      >
        {#if isSyncing}
          <div
            class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4"
          >
            <div
              class="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            ></div>
            <p class="text-sm font-bold text-blue-600 animate-pulse">
              Sincronizzazione in corso...
            </p>
          </div>
        {/if}

        <h2
          class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Sincronizzazione Totale
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          Sincronizza tutti i documenti presenti nella cartella <code
            class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
            >mdocs/</code
          > con la memoria di Letta. Questa operazione indicizzerà tutti i file markdown
          per renderli consultabili dall'AI.
        </p>

        <form
          method="POST"
          action="?/syncMemory"
          use:enhance={() => {
            isSyncing = true;
            return async ({ update }) => {
              isSyncing = false;
              await update();
            };
          }}
        >
          <button
            type="submit"
            disabled={isSyncing}
            class="w-full sm:w-auto px-8 py-4 bg-linear-to-br from-purple-600 to-blue-600 text-white font-extrabold rounded-2xl hover:shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-tight"
          >
            Sincronizza Ora
          </button>
        </form>

        {#if form?.results}
          <div class="mt-8 border-t border-gray-100 pt-6">
            <h3
              class="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider"
            >
              Log Sincronizzazione
            </h3>
            <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
              {#each form.results as res}
                <div
                  class="flex items-center justify-between text-xs p-2 rounded bg-gray-50 border border-gray-100"
                >
                  <span class="font-mono truncate max-w-[200px]"
                    >{res.file}</span
                  >
                  {#if res.status === "success"}
                    <span
                      class="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded ring-1 ring-green-500/10"
                      >OK</span
                    >
                  {:else}
                    <span
                      class="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-500/10"
                      title={res.message}>FAIL</span
                    >
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    </div>

    <!-- Sidebar Info -->
    <div class="space-y-8">
      <LettaStatus userId="admin" projectId={data.projectId} />

      {#if data.folderInfo}
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Cartella Progetto
          </h3>
          <div class="space-y-2">
            <p class="text-xs text-gray-400 font-medium uppercase">
              Nome Folder
            </p>
            <p
              class="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-100"
            >
              {data.folderInfo.name}
            </p>

            <p class="text-xs text-gray-400 font-medium uppercase mt-4">
              Folder ID
            </p>
            <p
              class="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-100 truncate"
              title={data.folderInfo.id}
            >
              {data.folderInfo.id}
            </p>
          </div>
        </div>
      {/if}

      <div
        class="bg-linear-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-xl ring-1 ring-white/10"
      >
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-blue-400"
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
          Info Integrazione
        </h3>
        <ul class="space-y-3 text-sm text-gray-300">
          <li class="flex items-start gap-2">
            <span class="text-blue-400 font-bold mt-1">•</span>
            Gli agenti Letta mantengono una memoria a lungo termine dei documenti
            sincronizzati.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-400 font-bold mt-1">•</span>
            La "Memoria Condivisa" permette a diversi collaboratori di avere lo stesso
            contesto sul progetto.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-400 font-bold mt-1">•</span>
            L'API Key è essenziale per la comunicazione con la piattaforma Letta
            Cloud o Self-Hosted.
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
