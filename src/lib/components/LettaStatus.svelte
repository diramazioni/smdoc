<script lang="ts">
  import { onMount } from "svelte";

  // Props
  interface Props {
    projectId: string;
    userId: string;
  }
  let { projectId, userId }: Props = $props();

  // State
  let stats = $state<{
    agentId?: string;
    blockId?: string;
    folderId?: string;
    totalFiles?: number;
    lastSync?: string;
  }>({});

  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadStats() {
    loading = true;
    error = null;
    try {
      const response = await fetch(
        `/api/letta/stats?projectId=${projectId}&userId=${userId}`,
      );
      const data = await response.json();
      if (data.success) {
        stats = data;
      } else {
        error = data.error || "Failed to load statistics";
      }
    } catch (err: any) {
      console.error("Failed to load Letta stats:", err);
      error = err.message || "Network error while loading statistics";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadStats();
  });
</script>

<div
  class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md"
>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">
      Letta Integration Status
    </h3>
    <button
      onclick={loadStats}
      class="text-blue-500 hover:text-blue-700 transition-colors"
      title="Ricarica"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 {loading ? 'animate-spin' : ''}"
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
    </button>
  </div>

  {#if loading && !stats.agentId}
    <div class="flex flex-col gap-3">
      <div class="h-4 bg-gray-100 animate-pulse rounded w-3/4"></div>
      <div class="h-4 bg-gray-100 animate-pulse rounded w-1/2"></div>
      <div class="h-4 bg-gray-100 animate-pulse rounded w-2/3"></div>
    </div>
  {:else}
    <div class="space-y-4">
      {#if error}
        <div
          class="p-2 text-xs bg-red-50 text-red-600 rounded border border-red-100"
        >
          {error}
        </div>
      {/if}

      <div class="grid grid-cols-1 gap-4">
        <div
          class="flex items-center justify-between border-b border-gray-50 pb-2"
        >
          <span class="text-xs text-gray-400 font-medium">Agent ID</span>
          <span
            class="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded truncate max-w-[180px]"
            title={stats.agentId}
          >
            {stats.agentId || "None"}
          </span>
        </div>

        <div
          class="flex items-center justify-between border-b border-gray-50 pb-2"
        >
          <span class="text-xs text-gray-400 font-medium">Shared Block</span>
          <span
            class="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded truncate max-w-[180px]"
            title={stats.blockId}
          >
            {stats.blockId || "None"}
          </span>
        </div>

        <div
          class="flex items-center justify-between border-b border-gray-50 pb-2"
        >
          <span class="text-xs text-gray-400 font-medium">Total Files</span>
          <span
            class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
          >
            {stats.totalFiles || 0}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-medium">Last Sync</span>
          <span class="text-xs text-gray-500">
            {stats.lastSync
              ? new Date(stats.lastSync).toLocaleTimeString()
              : "Never"}
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>
