import { getLettaClient, isSelfHosted } from './client';

export function getLettaProjectId(): string {
  return process.env.LETTA_PROJECT_ID || import.meta.env.VITE_LETTA_PROJECT_ID || 'smdr-main';
}

// Configurazione costanti
export const LETTA_CONFIG = {
  model: 'openai/gpt-4o',
  embedding: 'openai/text-embedding-3-small',
  tools: [
    'archival_memory_insert', 
    'archival_memory_search', 
    'semantic_search_files', 
    'conversation_search',
    'open_files',
    'grep_files'
  ]
} as const;

/**
 * Crea o recupera un agente per un utente
 */
export async function getOrCreateUserAgent(userId: string) {
  const client = getLettaClient();

  // Cerca agent esistente con tag user:{userId}
  const agentsPage = await client.agents.list({
    tags: [`user:${userId}`]
  });

  if (agentsPage.items.length > 0) {
    return agentsPage.items[0];
  }

  // Crea nuovo agente
  const agent = await client.agents.create({
    model: LETTA_CONFIG.model,
    ...(isSelfHosted() ? { embedding: LETTA_CONFIG.embedding } : {}),
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
    tools: LETTA_CONFIG.tools as any,
    tags: [`user:${userId}`, 'smdr-cms']
  });

  return agent;
}

/**
 * Crea o recupera la memoria condivisa per un progetto
 */
export async function getOrCreateSharedMemory(projectId?: string) {
  const finalProjectId = projectId || getLettaProjectId();
  const client = getLettaClient();

  // Cerca blocco condiviso esistente
  const blocksPage = await client.blocks.list();
  const sharedBlock = blocksPage.items.find(b =>
    b.label === `project:${finalProjectId}` &&
    b.description?.includes('Shared memory for project')
  );

  if (sharedBlock) {
    return sharedBlock;
  }

  // Crea nuovo blocco condiviso
  const block = await client.blocks.create({
    label: `project:${finalProjectId}`,
    description: `Shared memory block for project ${finalProjectId}. Contains project metadata, structure, and context shared across all user agents.`,
    value: `Project ID: ${finalProjectId}\nCreated: ${new Date().toISOString()}\n\nProject content will be indexed here.`
  });

  return block;
}

/**
 * Collega un agente alla memoria condivisa del progetto
 */
export async function attachSharedMemory(
  agentId: string,
  projectId?: string
) {
  const finalProjectId = projectId || getLettaProjectId();
  const client = getLettaClient();
  const sharedBlock = await getOrCreateSharedMemory(finalProjectId);

  // Ottieni blocchi attuali dell'agente
  const agent = await client.agents.retrieve(agentId);
  const currentBlocks = agent.blocks || [];

  // Se non già collegato, aggiungi il blocco
  if (!currentBlocks.some(b => b.id === sharedBlock.id)) {
    const blockIds = currentBlocks
      .map(b => b.id)
      .filter((id): id is string => !!id);

    await client.agents.update(agentId, {
      block_ids: [...blockIds, sharedBlock.id]
    });
  }

  return sharedBlock;
}
