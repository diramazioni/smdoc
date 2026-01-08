import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId, directoryPath, action } = await request.json();

    if (!projectId || !directoryPath || !action) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (action !== 'created' && action !== 'deleted') {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Import the Letta sync function
    const { syncDirectoryWithLetta } = await import('$lib/letta/filesystem-service');

    // Sync with Letta
    await syncDirectoryWithLetta(projectId, directoryPath, action);

    return json({ success: true });
  } catch (error) {
    console.error('Error syncing directory with Letta:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};
