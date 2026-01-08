<script lang="ts">
  import { onMount } from "svelte";
  import type { LettaMessage, LettaRole } from "../letta/types";

  // Svelte 5 Runes
  let messages = $state<LettaMessage[]>([]);
  let inputMessage = $state("");
  let isLoading = $derived.by(
    () => messages.length > 0 && messages[messages.length - 1].role === "user",
  );
  let chatContainer = $state<HTMLElement | null>(null);

  // Props
  interface Props {
    projectId?: string;
    userId: string;
  }
  let { projectId, userId }: Props = $props();

  // Scroll automatico quando arrivano nuovi messaggi
  $effect(() => {
    if (chatContainer && messages.length > 0) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage.trim();
    inputMessage = "";

    // Aggiungi messaggio utente
    messages = [...messages, { role: "user", content: userMsg }];

    try {
      const response = await fetch("/api/letta/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          projectId,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        messages = [
          ...messages,
          {
            role: "assistant",
            content: data.message,
          },
        ];
      } else {
        messages = [
          ...messages,
          {
            role: "assistant",
            content: `Error: ${data.error}`,
          },
        ];
      }
    } catch (error: any) {
      messages = [
        ...messages,
        {
          role: "assistant",
          content: `Network error: ${error.message}`,
        },
      ];
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div
  class="flex flex-col h-full max-h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
>
  <!-- Chat Header -->
  <div
    class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between"
  >
    <h3 class="text-sm font-bold text-gray-700">Letta AI Assistant</h3>
    <div
      class="h-2 w-2 rounded-full bg-green-500 animate-pulse"
      title="Connected"
    ></div>
  </div>

  <!-- Messages Container -->
  <div
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/30"
  >
    {#if messages.length === 0}
      <div
        class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 opacity-60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p class="text-sm">Chiedimi qualcosa sui tuoi documenti!</p>
      </div>
    {/if}

    {#each messages as msg, i (i)}
      <div
        class="flex flex-col gap-1 p-3 rounded-2xl max-w-[85%] {msg.role ===
        'user'
          ? 'self-end bg-blue-600 text-white rounded-tr-none'
          : 'self-start bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}"
      >
        <div
          class="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1"
        >
          {msg.role}
        </div>
        <div
          class="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word"
        >
          {msg.content}
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div
        class="flex flex-col gap-1 p-3 rounded-2xl max-w-[85%] self-start bg-white border border-gray-200 text-gray-800 rounded-tl-none opacity-70 animate-pulse"
      >
        <div
          class="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1"
        >
          assistant
        </div>
        <div class="flex gap-1 py-1">
          <div
            class="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"
          ></div>
          <div
            class="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"
          ></div>
          <div
            class="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"
          ></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div
    class="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
  >
    <div class="flex gap-2">
      <textarea
        bind:value={inputMessage}
        placeholder="Chiedi a Letta..."
        onkeydown={handleKeydown}
        rows={1}
        class="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
      ></textarea>
      <button
        onclick={sendMessage}
        disabled={isLoading || !inputMessage.trim()}
        class="flex items-center justify-center h-9 w-9 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        aria-label="Invia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
          />
        </svg>
      </button>
    </div>
  </div>
</div>
