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
  fileType: LettaFileType,
  isWebContent: boolean = true
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);

  try {
    const fileBuffer = readFileSync(filePath);
    
    // Se è contenuto web, aggiungi /webdocs/ prefix
    // Altrimenti usa il path originale
    const baseName = filePath.split('/').pop() || 'unknown';
    const fileName = isWebContent ? `webdocs/${baseName}` : baseName;

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

/**
 * Sincronizza la creazione/eliminazione di una directory con Letta
 */
export async function syncDirectoryWithLetta(
  projectId: string,
  directoryPath: string,
  action: 'created' | 'deleted'
) {
  const client = getLettaClient();
  const sharedBlock = await getOrCreateSharedMemory(projectId);

  const timestamp = new Date().toISOString();
  // Usa /webdocs/ prefix per directory web
  const lettaPath = `/webdocs/${directoryPath.split('/').pop()}`;
  
  const dirInfo = `
## Web Directory ${action}: ${timestamp}
- Letta Path: ${lettaPath}
- Local Path: ${directoryPath}
- Type: web-content-directory
`;

  // Aggiorna il blocco condiviso
  const currentContent = sharedBlock.value || '';
  await client.blocks.update(sharedBlock.id, {
    value: currentContent + dirInfo
  });

  return sharedBlock;
}

/**
 * Crea una folder in Letta (non una directory nel filesystem)
 * Le folder di Letta sono contenitori per file con embedding
 */
export async function createLettaFolder(
  folderName: string,
  embeddingModel: string = 'openai/text-embedding-3-small'
) {
  const client = getLettaClient();

  try {
    const folder = await client.folders.create({
      name: folderName,
      embedding: embeddingModel,
      ...(isSelfHosted() ? {
        embedding_config: {
          embedding_model: 'text-embedding-3-small',
          embedding_endpoint_type: 'openai',
          embedding_dim: 1536
        }
      } : {})
    });

    return folder;
  } catch (err) {
    console.error('Letta folder creation error:', err);
    throw err;
  }
}

/**
 * Carica file/directory in Letta per indexing (non contenuti web)
 * Mantiene la struttura originale delle directory
 */
export async function uploadIndexedContent(
  projectId: string,
  sourcePath: string,
  isDirectory: boolean = false
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    if (isDirectory) {
      // Carica tutti i file nella directory ricorsivamente
      const files = await getAllFilesInDirectory(sourcePath);
      const results = [];

      for (const file of files) {
        const relativePath = file.replace(sourcePath + '/', '');
        const fileBuffer = readFileSync(file);
        const lettaFile = new File([fileBuffer], relativePath, { 
          type: getMimeType(file) 
        });

        const uploadJob = await client.folders.files.upload(
          folder.id,
          { file: lettaFile as any }
        );

        results.push({ file: relativePath, jobId: uploadJob.id });
      }

      return { success: true, results };
    } else {
      // Carica singolo file
      const fileBuffer = readFileSync(sourcePath);
      const fileName = sourcePath.split('/').pop() || 'unknown';
      const lettaFile = new File([fileBuffer], fileName, { 
        type: getMimeType(sourcePath) 
      });

      const uploadJob = await client.folders.files.upload(
        folder.id,
        { file: lettaFile as any }
      );

      return { success: true, jobId: uploadJob.id };
    }
  } catch (err) {
    console.error('Letta indexed content upload error:', err);
    throw err;
  }
}

/**
 * Carica array di File (da FormData) in Letta
 */
export async function uploadIndexedFiles(
  projectId: string,
  files: File[]
) {
  const client = getLettaClient();
  const folder = await getOrCreateProjectFolder(projectId);
  const results = [];

  try {
    for (const file of files) {
      if (!file.name) continue;
      
      const uploadJob = await client.folders.files.upload(
        folder.id,
        { file: file as any }
      );

      results.push({ file: file.name, jobId: uploadJob.id });
    }

    return { success: true, results };
  } catch (err) {
    console.error('Letta indexed files upload error:', err);
    throw err;
  }
}

// Helper functions
async function getAllFilesInDirectory(dirPath: string): Promise<string[]> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await scan(dirPath);
  return files;
}

function getMimeType(filePath: string): string {
  if (filePath.endsWith('.md')) return 'text/markdown';
  if (filePath.endsWith('.pdf')) return 'application/pdf';
  if (filePath.endsWith('.txt')) return 'text/plain';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.xml')) return 'application/xml';
  if (filePath.endsWith('.html')) return 'text/html';
  return 'application/octet-stream';
}
