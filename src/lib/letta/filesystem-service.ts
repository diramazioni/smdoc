import { getLettaClient, isSelfHosted } from './client';
import { readFileSync } from 'fs';
import { getOrCreateSharedMemory, getOrCreateProjectFolder } from './letta-service';
import type { LettaFileType, LettaSyncAction, LettaSyncMetadata } from './types';

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
 * Rimuove un file dalla folder del progetto in Letta
 */
export async function deleteFileFromLetta(
  projectId: string,
  fileName: string
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);

  try {
    // Recupera la lista dei file nella folder
    const filesPage = await (client.folders as any).files.list(folder.id);
    // Letta uses snake_case for file properties: file_name, original_file_name, etc.
    const file = filesPage.items.find((f: any) => 
      f.file_name === fileName || 
      f.original_file_name === fileName ||
      f.id === fileName
    );

    if (file) {
      console.log(`Deleting file ${fileName} (${file.id}) from Letta folder ${folder.id}...`);
      await (client.folders as any).files.delete(file.id, { folder_id: folder.id });
      return { success: true, fileId: file.id };
    } else {
      console.warn(`File ${fileName} not found in Letta folder ${folder.id}`);
      return { success: false, message: 'File not found' };
    }
  } catch (err) {
    console.error('Letta delete error:', err);
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
