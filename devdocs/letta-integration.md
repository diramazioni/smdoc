# Piano Completo: Integrazione Letta nel CMS SMDR

**Branch**: `letta-integration`
**Data**: 2026-01-07
**Obiettivo**: Integrare Letta Client nel CMS per gestire documenti e fornire assistenza AI con memoria condivisa

---

## 📋 Panoramica dell'Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    SMDR CMS (SvelteKit)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Edit Page   │────────▶│  Chat UI      │                  │
│  │  (Esistente) │         │  (Nuovo)      │                  │
│  └──────┬───────┘         └───────┬──────┘                  │
│         │                         │                           │
│         │ Upload/Edit             │ Chat                      │
│         ▼                         ▼                           │
│  ┌──────────────────────────────────────────────┐           │
│  │         Backend API Routes                     │           │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐ │           │
│  │  │ Letta    │  │ File     │  │ Chat       │ │           │
│  │  │ Service  │  │ Sync     │  │ Endpoint  │ │           │
│  │  └──────────┘  └──────────┘  └────────────┘ │           │
│  └───────────────┬──────────────────────────────┘           │
│                  │                                          │
│                  ▼                                          │
│  ┌──────────────────────────────────────────────┐           │
│  │         Letta Platform                        │           │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐ │           │
│  │  │ Agent    │  │ Shared   │  │ Filesystem │ │           │
│  │  │ per User │  │ Memory   │  │ (Folders)  │ │           │
│  │  └──────────┘  └──────────┘  └────────────┘ │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ FASE 1: Setup e Configurazione

### 1.1 Installazione Dipendenze

```bash
npm install @letta-ai/letta-client
# O per integrazione con Vercel AI SDK (opzionale):
npm install @letta-ai/vercel-ai-sdk-provider ai
```

### 1.2 Variabili d'Ambiente

Aggiungere al file `.env`:

```env
# Letta Configuration
LETTA_API_KEY=your_api_key_here

# Per self-hosted (opzionale):
# LETTA_BASE_URL=http://localhost:8283
```

### 1.3 Configurazione Letta Client

Creare il file `src/lib/letta/client.ts`:

```typescript
import { Letta } from '@letta-ai/letta-client';

// Singleton pattern per il client Letta
let lettaClient: Letta | null = null;

export function getLettaClient(): Letta {
  if (!lettaClient) {
    lettaClient = new Letta({
      apiKey: import.meta.env.VITE_LETTA_API_KEY,
      // baseUrl: import.meta.env.VITE_LETTA_BASE_URL, // se self-hosted
    });
  }
  return lettaClient;
}
```

---

## 🔧 FASE 2: Backend API Routes

### 2.1 Servizio Letta Core

Creare il file `src/lib/letta/letta-service.ts`:

```typescript
import { getLettaClient } from './client';

// Configurazione costanti
export const LETTA_CONFIG = {
  model: 'openai/gpt-4.1',
  embedding: 'openai/text-embedding-3-small',
  tools: ['archival_memory_insert', 'archival_memory_search',
          'open_file', 'grep_file', 'search_file']
} as const;

/**
 * Crea o recupera un agente per un utente
 */
export async function getOrCreateUserAgent(userId: string) {
  const client = getLettaClient();

  // Cerca agent esistente con tag user:{userId}
  const agents = await client.agents.list({
    tags: [`user:${userId}`]
  });

  if (agents.length > 0) {
    return agents[0];
  }

  // Crea nuovo agente
  const agent = await client.agents.create({
    model: LETTA_CONFIG.model,
    embedding: LETTA_CONFIG.embedding,
    memory_blocks: [
      {
        label: 'human',
        value: `User ID: ${userId}. User manages content in the SMDR CMS.`,
        limit: 2000
      },
      {
        label: 'persona',
        value: 'You are a helpful assistant for the SMDR CMS. You help users manage and understand their content.',
        limit: 2000
      },
      {
        label: 'project_context',
        value: 'SMDR is a markdown-based CMS. Users create/edit markdown, PDF, and image files.',
        description: 'Stores context about the SMDR CMS project',
        limit: 2000
      }
    ],
    tools: LETTA_CONFIG.tools,
    tags: [`user:${userId}`, 'smdr-cms']
  });

  return agent;
}

/**
 * Crea o recupera la memoria condivisa per un progetto
 */
export async function getOrCreateSharedMemory(projectId: string) {
  const client = getLettaClient();

  // Cerca blocco condiviso esistente
  const blocks = await client.blocks.list();
  const sharedBlock = blocks.find(b =>
    b.label === `project:${projectId}` &&
    b.description?.includes('Shared memory for project')
  );

  if (sharedBlock) {
    return sharedBlock;
  }

  // Crea nuovo blocco condiviso
  const block = await client.blocks.create({
    label: `project:${projectId}`,
    description: `Shared memory block for project ${projectId}. Contains project metadata, structure, and context shared across all user agents.`,
    value: `Project ID: ${projectId}\nCreated: ${new Date().toISOString()}\n\nProject content will be indexed here.`
  });

  return block;
}

/**
 * Collega un agente alla memoria condivisa del progetto
 */
export async function attachSharedMemory(
  agentId: string,
  projectId: string
) {
  const client = getLettaClient();
  const sharedBlock = await getOrCreateSharedMemory(projectId);

  // Ottieni blocchi attuali dell'agente
  const agent = await client.agents.retrieve(agentId);
  const currentBlockIds = agent.block_ids || [];

  // Se non già collegato, aggiungi il blocco
  if (!currentBlockIds.includes(sharedBlock.id)) {
    await client.agents.update(agentId, {
      block_ids: [...currentBlockIds, sharedBlock.id]
    });
  }

  return sharedBlock;
}
```

### 2.2 Gestione Filesystem

Creare il file `src/lib/letta/filesystem-service.ts`:

```typescript
import { getLettaClient } from './client';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Crea o recupera una folder per un progetto
 */
export async function getOrCreateProjectFolder(projectId: string) {
  const client = getLettaClient();

  const folders = await client.folders.list();
  const folder = folders.find(f =>
    f.name === `project-${projectId}`
  );

  if (folder) {
    return folder;
  }

  return await client.folders.create({
    name: `project-${projectId}`,
    description: `Contains all documents for project ${projectId}`,
    embedding: 'openai/text-embedding-3-small'
  });
}

/**
 * Carica un file nella folder del progetto
 */
export async function uploadFileToLetta(
  projectId: string,
  filePath: string,
  fileType: 'markdown' | 'pdf' | 'image'
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);

  // Verifica che il file esista
  const fileBuffer = readFileSync(filePath);
  const fileStream = new ReadableStream({
    start(controller) {
      controller.enqueue(fileBuffer);
      controller.close();
    }
  });

  // Carica il file
  const uploadJob = await client.folders.files.upload(
    fileStream as any,
    folder.id
  );

  // Attendi completamento
  while (true) {
    const job = await client.jobs.retrieve(uploadJob.id);
    if (job.status === 'completed') {
      break;
    } else if (job.status === 'failed') {
      throw new Error(`Upload failed: ${job.metadata}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { folderId: folder.id, jobId: uploadJob.id };
}

/**
 * Aggiorna la memoria condivisa con info sul file
 */
export async function updateSharedMemoryWithFile(
  projectId: string,
  filePath: string,
  action: 'created' | 'updated' | 'deleted',
  metadata?: { title?: string; slug?: string; description?: string }
) {
  const client = getLettaClient();
  const sharedBlock = await getOrCreateSharedMemory(projectId);

  const timestamp = new Date().toISOString();
  const fileInfo = `
## File ${action}: ${timestamp}
- Path: ${filePath}
- Type: ${filePath.split('.').pop()}
${metadata?.title ? `- Title: ${metadata.title}` : ''}
${metadata?.slug ? `- Slug: ${metadata.slug}` : ''}
${metadata?.description ? `- Description: ${metadata.description}` : ''}
`;

  // Aggiorna il blocco condiviso
  const currentContent = sharedBlock.value || '';
  await client.blocks.update(sharedBlock.id, {
    value: currentContent + fileInfo
  });

  return sharedBlock;
}
```

### 2.3 API Route: Chat

Creare il file `src/routes/api/letta/chat/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { getOrCreateUserAgent } from '$lib/letta/letta-service';

export async function POST({ request, locals }) {
  try {
    const { message, projectId, userId } = await request.json();

    // Recupera o crea agente
    const agent = await getOrCreateUserAgent(userId);

    // Collega alla memoria condivisa del progetto
    if (projectId) {
      const { attachSharedMemory } = await import('$lib/letta/letta-service');
      await attachSharedMemory(agent.id, projectId);
    }

    // Invia messaggio all'agente
    const response = await getLettaClient().agents.messages.create(
      agent.id,
      {
        messages: [{ role: 'user', content: message }]
      }
    );

    // Estrai risposta
    let assistantMessage = '';
    for (const msg of response.messages) {
      if (msg.message_type === 'assistant_message') {
        assistantMessage += msg.content;
      }
    }

    return json({
      success: true,
      message: assistantMessage,
      agentId: agent.id,
      debug: {
        messageTypes: response.messages.map(m => m.message_type)
      }
    });

  } catch (error) {
    console.error('Letta chat error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 2.4 API Route: File Sync

Creare il file `src/routes/api/letta/sync/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { uploadFileToLetta, updateSharedMemoryWithFile }
  from '$lib/letta/filesystem-service';

export async function POST({ request }) {
  try {
    const { projectId, filePath, action, metadata } = await request.json();

    // Carica file nel filesystem Letta
    await uploadFileToLetta(projectId, filePath, 'markdown');

    // Aggiorna memoria condivisa
    const sharedBlock = await updateSharedMemoryWithFile(
      projectId,
      filePath,
      action,
      metadata
    );

    return json({
      success: true,
      blockId: sharedBlock.id
    });

  } catch (error) {
    console.error('Letta sync error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🎨 FASE 3: Frontend Componenti (Svelte 5 Runes)

### 3.1 Chat Component con Svelte 5 Runes

Creare il file `src/lib/components/LettaChat.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  // Svelte 5 Runes - NO $effect per side effects!
  let messages = $state<Array<{role: 'user' | 'assistant', content: string}>>([]);
  let inputMessage = $state('');
  let isLoading = $derived.by(() =>
    messages.length > 0 && messages[messages.length - 1].role === 'user'
  );
  let chatContainer: HTMLElement;

  // Props
  interface Props {
    projectId?: string;
    userId: string;
  }
  let { projectId, userId }: Props = $props();

  // Scroll automatico quando arrivano nuovi messaggi
  $effect(() => {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage.trim();
    inputMessage = '';

    // Aggiungi messaggio utente
    messages = [...messages, { role: 'user', content: userMsg }];

    try {
      const response = await fetch('/api/letta/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          projectId,
          userId
        })
      });

      const data = await response.json();

      if (data.success) {
        messages = [...messages, {
          role: 'assistant',
          content: data.message
        }];
      } else {
        messages = [...messages, {
          role: 'assistant',
          content: `Error: ${data.error}`
        }];
      }
    } catch (error) {
      messages = [...messages, {
        role: 'assistant',
        content: `Network error: ${error.message}`
      }];
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex flex-col h-full max-h-[600px] border border-gray-200 rounded-lg overflow-hidden">
  <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
    {#each messages as msg (messages.indexOf(msg))}
      <div class="flex flex-col gap-1 p-3 rounded-lg max-w-[80%] {msg.role === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-100 text-gray-800'}">
        <div class="text-xs font-semibold opacity-80 uppercase">{msg.role}</div>
        <div class="whitespace-pre-wrap break-words">
          {msg.content}
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div class="flex flex-col gap-1 p-3 rounded-lg max-w-[80%] self-start bg-gray-100 text-gray-800 opacity-70">
        <div class="text-xs font-semibold opacity-80 uppercase">assistant</div>
        <div class="whitespace-pre-wrap break-words">
          <span class="animate-pulse">Thinking...</span>
        </div>
      </div>
    {/if}
  </div>

  <div class="flex gap-2 p-4 border-t border-gray-200 bg-white">
    <textarea
      bind:value={inputMessage}
      placeholder="Ask about your content..."
      onkeydown={handleKeydown}
      rows={3}
      class="flex-1 resize-none border border-gray-300 rounded-md p-2 font-inherit"
    />
    <button
      onclick={sendMessage}
      disabled={isLoading || !inputMessage.trim()}
      class="px-4 py-2 bg-blue-500 text-white border-none rounded-md cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Send
    </button>
  </div>
</div>
```

### 3.2 Integrazione nella Edit Page

Modificare il file `src/routes/edit/[...slug]/+page.svelte`:

```svelte
<script lang="ts">
  // ... import esistenti ...
  import LettaChat from '$lib/components/LettaChat.svelte';

  // ... codice esistente ...

  // Aggiungi state per il chat panel
  let showChat = $state(false);

  // Dopo il salvataggio, sincronizza con Letta
  async function handleSave() {
    // ... logica salvataggio esistente ...

    // Sincronizza con Letta
    if (saveResult.success) {
      await syncWithLetta('updated', {
        title: metadata.title,
        slug: metadata.slug,
        description: metadata.description
      });
    }
  }

  async function syncWithLetta(
    action: 'created' | 'updated' | 'deleted',
    metadata?: any
  ) {
    try {
      await fetch('/api/letta/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'smdr-main', // o dinamico
          filePath: slug,
          action,
          metadata
        })
      });
    } catch (error) {
      console.error('Letta sync failed:', error);
      // Non bloccare l'UX per errori di sincronizzazione
    }
  }
</script>

<div class="edit-page">
  <!-- ... contenuto esistente ... -->

  <!-- Aggiungi chat panel -->
  <div class="fixed bottom-8 right-8 z-[1000]">
    <button onclick={() => showChat = !showChat} class="px-6 py-3 bg-purple-500 text-white border-none rounded-full cursor-pointer font-semibold shadow-md">
      {showChat ? 'Hide AI Chat' : 'Show AI Chat'}
    </button>
  </div>

  {#if showChat}
    <div class="fixed bottom-20 right-8 w-[500px] h-[600px] z-[999] shadow-lg rounded-xl overflow-hidden">
      <LettaChat
        userId={currentUserId}
        projectId="smdr-main"
      />
    </div>
  {/if}
</div>
```

---

## 🧠 FASE 4: Gestione Memoria Condivisa

### 4.1 Aggiornamento Automatico

Creare il file `src/lib/letta/memory-manager.ts`:

```typescript
import { getOrCreateSharedMemory } from './letta-service';

/**
 * Aggiorna la memoria condivisa con metadati del progetto
 */
export async function updateProjectMemory(
  projectId: string,
  update: {
    structure?: Record<string, any>;
    recentChanges?: Array<{timestamp: string, action: string, file: string}>;
    statistics?: {totalFiles: number, totalSize: number}
  }
) {
  const sharedBlock = await getOrCreateSharedMemory(projectId);

  let content = sharedBlock.value || '';

  if (update.structure) {
    content += `\n\n## Project Structure\n\`\`\`json\n${JSON.stringify(update.structure, null, 2)}\n\`\`\``;
  }

  if (update.recentChanges) {
    content += `\n\n## Recent Changes\n`;
    update.recentChanges.forEach(change => {
      content += `- [${change.timestamp}] ${change.action}: ${change.file}\n`;
    });
  }

  if (update.statistics) {
    content += `\n\n## Statistics\n`;
    content += `- Total Files: ${update.statistics.totalFiles}\n`;
    content += `- Total Size: ${update.statistics.totalSize} bytes\n`;
  }

  const client = getLettaClient();
  await client.blocks.update(sharedBlock.id, { value: content });

  return sharedBlock;
}
```

---

## 📊 FASE 5: Dashboard e Monitoraggio

### 5.1 Componente Status Panel

Creare il file `src/lib/components/LettaStatus.svelte`:

```svelte
<script lang="ts">
  interface Props {
    projectId: string;
    userId: string;
  }
  let { projectId, userId }: Props = $props();

  let stats = $state<{
    agentId?: string;
    blockId?: string;
    folderId?: string;
    totalFiles?: number;
    lastSync?: string;
  }>({});

  let loading = $state(true);

  async function loadStats() {
    loading = true;
    try {
      const response = await fetch(`/api/letta/stats?projectId=${projectId}&userId=${userId}`);
      const data = await response.json();
      stats = data;
    } catch (error) {
      console.error('Failed to load Letta stats:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadStats();
  });
</script>

<div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
  <h3 class="text-lg font-bold mb-4">Letta Integration Status</h3>

  {#if loading}
    <p>Loading...</p>
  {:else}
    <div class="grid grid-cols-2 gap-4 mt-4">
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500 font-semibold uppercase">Agent ID</span>
        <span class="text-sm text-gray-800 break-all">{stats.agentId || 'Not connected'}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500 font-semibold uppercase">Shared Memory</span>
        <span class="text-sm text-gray-800 break-all">{stats.blockId || 'Not created'}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500 font-semibold uppercase">Total Files</span>
        <span class="text-sm text-gray-800 break-all">{stats.totalFiles || 0}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500 font-semibold uppercase">Last Sync</span>
        <span class="text-sm text-gray-800 break-all">{stats.lastSync || 'Never'}</span>
      </div>
    </div>
  {/if}
</div>
```

### 5.2 API Route: Stats

Creare il file `src/routes/api/letta/stats/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { getLettaClient } from '$lib/letta/client';
import { getOrCreateSharedMemory } from '$lib/letta/letta-service';
import { getOrCreateProjectFolder } from '$lib/letta/filesystem-service';

export async function GET({ url }) {
  try {
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    if (!projectId || !userId) {
      return json(
        { success: false, error: 'Missing projectId or userId' },
        { status: 400 }
      );
    }

    const client = getLettaClient();

    // Recupera agente
    const agents = await client.agents.list({ tags: [`user:${userId}`] });
    const agent = agents[0];

    // Recupera memoria condivisa
    const sharedBlock = await getOrCreateSharedMemory(projectId);

    // Recupera folder
    const folder = await getOrCreateProjectFolder(projectId);
    const files = await client.folders.files.list(folder.id);

    return json({
      success: true,
      agentId: agent?.id,
      blockId: sharedBlock.id,
      folderId: folder.id,
      totalFiles: files.length,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Letta stats error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🔄 FASE 6: Flusso di Integrazione

### 6.1 Onboarding Utente

Creare il file `src/lib/letta/onboarding.ts`:

```typescript
import { getOrCreateUserAgent, attachSharedMemory } from './letta-service';
import { getOrCreateProjectFolder } from './filesystem-service';

export async function onboardUserToLetta(userId: string, projectId: string) {
  // 1. Crea agente utente
  const agent = await getOrCreateUserAgent(userId);

  // 2. Collega alla memoria condivisa del progetto
  await attachSharedMemory(agent.id, projectId);

  // 3. Crea folder per file
  const folder = await getOrCreateProjectFolder(projectId);

  // 4. Carica file esistenti
  await syncExistingFiles(projectId, folder.id);

  return { agent, folder };
}
```

### 6.2 Sincronizzazione File Esistenti

```typescript
async function syncExistingFiles(projectId: string, folderId: string) {
  // Ottieni lista file dal CMS
  const files = await listProjectFiles(projectId);

  for (const file of files) {
    try {
      await uploadFileToLetta(projectId, file.path, file.type);
      await updateSharedMemoryWithFile(
        projectId,
        file.path,
        'created',
        file.metadata
      );
    } catch (error) {
      console.error(`Failed to sync ${file.path}:`, error);
    }
  }
}
```

---

## 📝 FASE 7: Best Practices Svelte 5

### 7.1 Pattern Reattivi Corretti

```typescript
// ✅ CORRETTO - Usare $derived per calcoli
let messages = $state([]);
let lastMessage = $derived(messages[messages.length - 1]);
let hasMessages = $derived(messages.length > 0);

// ❌ SBAGLIATO - Non usare $effect per calcoli
// $effect(() => {
//   lastMessage = messages[messages.length - 1];
// });

// ✅ CORRETTO - $effect solo per side effects
$effect(() => {
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

// ✅ CORRETTO - $derived.by per calcoli complessi
let canSendMessage = $derived.by(() => {
  return inputMessage.trim().length > 0 && !isLoading;
});
```

### 7.2 Gestione Errori

```typescript
let error = $state<string | null>(null);
let retryCount = $state(0);

async function sendMessage() {
  error = null;

  try {
    // ... logica invio
    retryCount = 0;
  } catch (err) {
    error = err.message;
    retryCount += 1;
  }
}
```

### 7.3 Props in Svelte 5

```typescript
// ✅ CORRETTO - Svelte 5 syntax
interface Props {
  projectId?: string;
  userId: string;
}
let { projectId, userId }: Props = $props();

// ❌ SBAGLIATO - Vecchia sintassi Svelte 4
// export let projectId;
// export let userId;
```

---

## 🧪 FASE 8: Testing

### 8.1 Unit Tests

Creare il file `src/lib/letta/letta-service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getOrCreateUserAgent } from './letta-service';

describe('Letta Service', () => {
  it('should create new agent for user', async () => {
    vi.mock('./client', () => ({
      getLettaClient: () => ({
        agents: {
          list: () => Promise.resolve([]),
          create: () => Promise.resolve({ id: 'agent-123' })
        }
      })
    }));

    const agent = await getOrCreateUserAgent('user-1');
    expect(agent.id).toBe('agent-123');
  });

  it('should return existing agent', async () => {
    const existingAgent = { id: 'agent-456' };
    vi.mock('./client', () => ({
      getLettaClient: () => ({
        agents: {
          list: () => Promise.resolve([existingAgent]),
          create: () => Promise.reject('Should not create')
        }
      })
    }));

    const agent = await getOrCreateUserAgent('user-1');
    expect(agent.id).toBe('agent-456');
  });
});
```

### 8.2 Integration Tests

Creare il file `src/lib/letta/integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { getOrCreateUserAgent, getOrCreateSharedMemory } from './letta-service';

describe('Letta Integration', () => {
  const testUserId = 'test-user-1';
  const testProjectId = 'test-project-1';

  beforeAll(async () => {
    // Cleanup any existing test data
  });

  it('should create and link agent with shared memory', async () => {
    const agent = await getOrCreateUserAgent(testUserId);
    expect(agent).toBeDefined();

    const sharedBlock = await getOrCreateSharedMemory(testProjectId);
    expect(sharedBlock).toBeDefined();

    // Verify agent has access to shared memory
    expect(agent.block_ids).toContain(sharedBlock.id);
  });
});
```

---

## 📚 Riepilogo Componenti

| Componente | Descrizione | File |
|------------|-------------|------|
| **Letta Client** | Singleton per connessione Letta | `src/lib/letta/client.ts` |
| **Letta Service** | Gestione agenti e memoria condivisa | `src/lib/letta/letta-service.ts` |
| **Filesystem Service** | Upload e sincronizzazione file | `src/lib/letta/filesystem-service.ts` |
| **Memory Manager** | Aggiornamento memoria progetto | `src/lib/letta/memory-manager.ts` |
| **Onboarding** | Setup iniziale utente | `src/lib/letta/onboarding.ts` |
| **Chat API** | Endpoint chat | `src/routes/api/letta/chat/+server.ts` |
| **Sync API** | Endpoint sincronizzazione file | `src/routes/api/letta/sync/+server.ts` |
| **Stats API** | Endpoint statistiche | `src/routes/api/letta/stats/+server.ts` |
| **LettaChat** | Componente chat UI | `src/lib/components/LettaChat.svelte` |
| **LettaStatus** | Dashboard stato | `src/lib/components/LettaStatus.svelte` |

---

## 🚀 Roadmap di Implementazione

### Fase 1: Setup (Giorno 1-2)
- [ ] Installazione dipendenze
- [ ] Configurazione variabili d'ambiente
- [ ] Creazione client Letta singleton

### Fase 2: Backend (Giorno 3-5)
- [ ] Implementazione Letta Service
- [ ] Implementazione Filesystem Service
- [ ] Creazione API routes (chat, sync, stats)

### Fase 3: Frontend (Giorno 6-8)
- [ ] Creazione componente LettaChat
- [ ] Creazione componente LettaStatus
- [ ] Integrazione nella Edit Page

### Fase 4: Testing (Giorno 9-10)
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests

### Fase 5: Deploy (Giorno 11-12)
- [ ] Configurazione ambiente di produzione
- [ ] Setup monitoring
- [ ] Documentazione utente

---

## 🔗 Risorse Letta

- **Documentazione principale**: https://docs.letta.com
- **TypeScript SDK**: https://docs.letta.com/api/typescript
- **Filesystem Guide**: https://docs.letta.com/guides/agents/filesystem
- **Archival Memory**: https://docs.letta.com/guides/agents/archival-memory
- **Multi-Agent Shared Memory**: https://docs.letta.com/guides/agents/multi-agent-shared-memory
- **Prompts per vibecoding**: https://docs.letta.com/prompts/

---

## ⚠️ Note Importanti

1. **Svelte 5 Runes**: Assicurarsi di usare `$state`, `$derived`, `$props` e NON `$effect` per side effects
2. **Stateful Agents**: Letta agents mantengono la conversazione lato server - non inviare tutta la history
3. **Error Handling**: Non bloccare l'UX per errori di sincronizzazione con Letta
4. **Performance**: Usare streaming per risposte lunghe se necessario
5. **Security**: Proteggere API key e usare autenticazione utente

---

## 📞 Supporto

Per problemi o domande:
- Letta Discord: https://discord.gg/letta
- Letta GitHub: https://github.com/letta-ai/letta
- Letta Forum: https://forum.letta.com
