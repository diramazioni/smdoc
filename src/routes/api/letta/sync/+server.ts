import { json } from '@sveltejs/kit';
import { uploadFileToLetta, updateSharedMemoryWithFile } from '$lib/letta/filesystem-service';
import { DOCS_DIR } from '$lib/config/files.server';
import path from 'node:path';

export async function POST({ request }) {
  try {
    const { projectId, slug, action, metadata } = await request.json();

    if (!projectId || !slug) {
      return json({ success: false, error: 'Project ID and slug are required' }, { status: 400 });
    }

    // Risolvi il path del file markdown
    const filePath = path.resolve(DOCS_DIR, `${slug}.md`);

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
