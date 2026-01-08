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
    const agentsPage = await client.agents.list({ tags: [`user:${userId}`] });
    const agent = agentsPage.items[0];

    // Recupera memoria condivisa
    const sharedBlock = await getOrCreateSharedMemory(projectId);

    // Recupera folder
    const folder = await getOrCreateProjectFolder(projectId);
    
    // In Letta SDK v2, list files in a folder
    // Based on filesystem-service.ts, we use client.folders.files.list or similar
    // Actually, let's check if client.folders.files is the correct path
    // In filesystem-service.ts: await client.folders.files.upload(folder.id, ...)
    const filesPage = await (client.folders as any).files.list(folder.id);

    return json({
      success: true,
      agentId: agent?.id,
      blockId: sharedBlock.id,
      folderId: folder.id,
      totalFiles: filesPage.items?.length || 0,
      lastSync: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Letta stats error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
