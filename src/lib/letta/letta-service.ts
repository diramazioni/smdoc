import { getLettaClient, isSelfHosted } from './client';

export function getLettaProjectId(): string {
  return process.env.LETTA_PROJECT_ID || import.meta.env.VITE_LETTA_PROJECT_ID || 'smdr-main';
}

export function getLettaFolderName(): string {
  return process.env.LETTA_FOLDER_NAME || import.meta.env.VITE_LETTA_FOLDER_NAME || `project-${getLettaProjectId()}`;
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
        value: 'You are a helpful assistant for the SMDR CMS. You help users manage and understand their content. Use semantic_search_files or grep_files to find information in documents when asked about content.',
        limit: 2000
      },
      {
        label: 'project_context',
        value: `SMDR is a markdown-based CMS. Project ID: ${getLettaProjectId()}. You have access to the project files via semantic_search_files, open_files, and grep_files.`,
        description: 'Stores context about the SMDR CMS project',
        limit: 2000
      }
    ],
    tools: LETTA_CONFIG.tools as any,
    tags: [`user:${userId}`, 'smdr-cms']
  });

  // Collega cartella progetto
  await attachProjectFolder(agent.id);

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

/**
 * Crea o recupera una folder per un progetto
 */
export async function getOrCreateProjectFolder(projectId?: string) {
  const finalProjectId = projectId || getLettaProjectId();
  const folderName = getLettaFolderName();
  const client = getLettaClient();

  const foldersPage = await client.folders.list();
  const folder = foldersPage.items.find(f =>
    f.name === folderName
  );

  if (folder) {
    return folder;
  }

  return await client.folders.create({
    name: folderName,
    ...(isSelfHosted() ? {
      embedding_config: {
        embedding_model: 'text-embedding-3-small',
        embedding_endpoint_type: 'openai',
        embedding_dim: 1536
      }
    } : {})
  });
}

/**
 * Collega un agente alla cartella del progetto
 */
export async function attachProjectFolder(
  agentId: string,
  projectId?: string
) {
  const finalProjectId = projectId || getLettaProjectId();
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(finalProjectId);

  // Ottieni cartelle attualmente collegate all'agente
  const attachedFolders = await client.agents.folders.list(agentId);
  
  // Se non già collegata, collega la cartella
  if (!attachedFolders.items.some(f => f.id === folder.id)) {
    await client.agents.folders.attach(folder.id, { agent_id: agentId });
  }

  return folder;
}

/**
 * Sincronizza l'attaccamento del folder per tutti gli agenti del progetto
 */
export async function syncAllAgentsFolders(projectId?: string) {
  const finalProjectId = projectId || getLettaProjectId();
  const client = getLettaClient();
  
  // Cerca tutti gli agenti del progetto
  const agentsPage = await client.agents.list({
    tags: ['smdr-cms']
  });

  console.log(`Syncing folders for ${agentsPage.items.length} agents...`);

  for (const agent of agentsPage.items) {
    try {
      await attachProjectFolder(agent.id, finalProjectId);
      console.log(`Folder sync successful for agent ${agent.name} (${agent.id})`);
    } catch (err) {
      console.error(`Failed to sync folder for agent ${agent.name}:`, err);
    }
  }
}
