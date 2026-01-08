import { getLettaClient, isSelfHosted } from './client';
import { readFileSync } from 'fs';
import { getOrCreateSharedMemory } from './letta-service';
import type { LettaFileType, LettaSyncAction, LettaSyncMetadata } from './types';

/**
 * Crea o recupera una folder per un progetto
 */
export async function getOrCreateProjectFolder(projectId: string) {
  const client = getLettaClient();

  const foldersPage = await client.folders.list();
  const folder = foldersPage.items.find(f =>
    f.name === `project-${projectId}`
  );

  if (folder) {
    return folder;
  }

  return await client.folders.create({
    name: `project-${projectId}`,
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
 * Carica un file nella folder del progetto
 */
export async function uploadFileToLetta(
  projectId: string,
  filePath: string,
  fileType: LettaFileType
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);

  try {
    const fileBuffer = readFileSync(filePath);
    const fileName = filePath.split('/').pop() || 'unknown';

    // Use File instead of Blob to ensure fileName is passed in multipart form
    // Letta SDK (and Python backend) requires the 'file' field to be present and properly named
    const file = new File([fileBuffer], fileName, { type: 'text/markdown' });

    const uploadJob = await client.folders.files.upload(
      folder.id,
      {
        file: file as any
      }
    );

    return { folderId: folder.id, jobId: uploadJob.id };
  } catch (err) {
    console.error('Letta upload error:', err);
    throw err;
  }
}

/**
 * Aggiorna la memoria condivisa con info sul file
 */
export async function updateSharedMemoryWithFile(
  projectId: string,
  filePath: string,
  action: LettaSyncAction,
  metadata?: LettaSyncMetadata
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
