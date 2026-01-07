import { json } from '@sveltejs/kit';
import { uploadFileToLetta, updateSharedMemoryWithFile } from '$lib/letta/filesystem-service';

export async function POST({ request }) {
  try {
    const { projectId, filePath, action, metadata } = await request.json();

    if (!projectId || !filePath) {
      return json({ success: false, error: 'Project ID and file path are required' }, { status: 400 });
    }

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

  } catch (error: any) {
    console.error('Letta sync error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
